import { useCallback, useEffect, useRef, useState } from "react";
import { detectLanguageFromText, toSpeechLocale, toSttLanguage } from "@/lib/voice-locale";
import { loadVoicePrefs, saveVoicePrefs } from "@/lib/voice-prefs";
import { detectVoiceControl, isStopPhrase, type VoiceControlAction } from "@/lib/voice-control-phrases";
import { releaseMicAnalyser, releaseOutputAnalyser, ensureAudioContext } from "@/lib/voice-audio-context";
import { speakPersonaText } from "@/lib/voice-tts-client";
import type { VoicePersona } from "@/lib/voice-persona";
import {
  mediaRecorderSupported,
  speechRecognitionSupported,
  transcribeWithServerStt,
} from "@/lib/voice-stt-client";

export type VoicePhase = "idle" | "listening" | "transcribing" | "speaking";

type Options = {
  lang: string;
  /** Browser speech recognition continuous mode */
  continuous?: boolean;
  /** Hands-free: auto-restart mic after speaking; pause mic while TTS plays */
  conversationMode?: boolean;
  /** Fire after a short pause following final speech (conversation mode) */
  autoSend?: boolean;
  autoSendDelayMs?: number;
  /** Called with final or interim transcript text */
  onTranscript?: (text: string, final: boolean) => void;
  /** Called when auto-send fires with the accumulated utterance */
  onAutoSend?: (text: string, lang: string) => void | Promise<void>;
  /** UI / STT language updated from spoken text */
  onLangDetected?: (lang: string) => void;
  /** Called for spoken control words (stop, confirm, cancel) */
  onVoiceControl?: (action: VoiceControlAction) => void;
};

const DEFAULT_AUTO_SEND_MS = 850;

export type VoiceSessionApi = ReturnType<typeof useVoiceSession>;

export function useVoiceSession(options: Options) {
  const {
    lang,
    continuous = true,
    conversationMode: conversationModeDefault = false,
    autoSend = loadVoicePrefs().autoSend ?? false,
    autoSendDelayMs = loadVoicePrefs().autoSendDelayMs ?? DEFAULT_AUTO_SEND_MS,
    onTranscript,
    onAutoSend,
    onLangDetected,
    onVoiceControl,
  } = options;

  const langRef = useRef(lang);
  langRef.current = lang;

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onAutoSendRef = useRef(onAutoSend);
  onAutoSendRef.current = onAutoSend;
  const onLangDetectedRef = useRef(onLangDetected);
  onLangDetectedRef.current = onLangDetected;
  const onVoiceControlRef = useRef(onVoiceControl);
  onVoiceControlRef.current = onVoiceControl;

  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [speakerOn, setSpeakerOnState] = useState(() => loadVoicePrefs().speakerOn);
  const [conversationMode, setConversationModeState] = useState(
    () => loadVoicePrefs().conversationMode ?? conversationModeDefault,
  );
  const [conversationActive, setConversationActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingAudio, setSpeakingAudio] = useState<HTMLAudioElement | null>(null);
  const [activePersona, setActivePersona] = useState<VoicePersona | null>(null);

  const recogRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const usingServerSttRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakAbortRef = useRef(0);
  const conversationActiveRef = useRef(false);
  const pausedForSpeechRef = useRef(false);
  const listeningPausedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUtteranceRef = useRef("");
  const autoSendFiredRef = useRef("");
  const transcriptBufferRef = useRef("");
  const bargeInActiveRef = useRef(false);
  const startMicInternalRef = useRef<() => Promise<void>>(async () => {});

  const micActive = phase === "listening" || phase === "transcribing";
  const handsFreeActive = conversationActive && conversationMode;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const applyDetectedLang = useCallback((text: string) => {
    const detected = detectLanguageFromText(text);
    if (!detected || detected === langRef.current.slice(0, 2)) return;
    langRef.current = detected;
    onLangDetectedRef.current?.(detected);
  }, []);

  const interruptSpeaking = useCallback(() => {
    speakAbortRef.current += 1;
    bargeInActiveRef.current = false;
    try {
      audioRef.current?.pause();
      audioRef.current = null;
    } catch {}
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingAudio(null);
    setActivePersona(null);
    releaseOutputAnalyser();
    pausedForSpeechRef.current = false;
    if (conversationActiveRef.current && conversationMode) {
      setPhase("listening");
    } else {
      setPhase("idle");
    }
  }, [conversationMode]);

  const dispatchVoiceControl = useCallback(
    (utterance: string) => {
      const action = detectVoiceControl(utterance);
      if (!action) return false;
      if (action === "stop") interruptSpeaking();
      onVoiceControlRef.current?.(action);
      clearSilenceTimer();
      pendingUtteranceRef.current = "";
      transcriptBufferRef.current = "";
      autoSendFiredRef.current = utterance;
      return true;
    },
    [clearSilenceTimer, interruptSpeaking],
  );

  const scheduleAutoSend = useCallback(
    (text: string) => {
      if (!autoSend || !conversationActiveRef.current) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      if (dispatchVoiceControl(trimmed)) return;
      pendingUtteranceRef.current = trimmed;
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        const utterance = pendingUtteranceRef.current.trim();
        if (!utterance || utterance === autoSendFiredRef.current) return;
        if (dispatchVoiceControl(utterance)) return;
        autoSendFiredRef.current = utterance;
        pendingUtteranceRef.current = "";
        transcriptBufferRef.current = "";
        void onAutoSendRef.current?.(utterance, langRef.current);
      }, autoSendDelayMs);
    },
    [autoSend, autoSendDelayMs, clearSilenceTimer, dispatchVoiceControl],
  );

  const releaseMicStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    releaseMicAnalyser();
    setMicStream(null);
  }, []);

  const stopRecognitionOnly = useCallback(() => {
    try {
      recogRef.current?.stop?.();
    } catch {}
    recogRef.current = null;
  }, []);

  const resetConversationState = useCallback(() => {
    conversationActiveRef.current = false;
    setConversationActive(false);
    pausedForSpeechRef.current = false;
    listeningPausedRef.current = false;
    transcriptBufferRef.current = "";
    pendingUtteranceRef.current = "";
    autoSendFiredRef.current = "";
  }, []);

  const failMicStart = useCallback(
    (message: string) => {
      resetConversationState();
      clearSilenceTimer();
      stopRecognitionOnly();
      releaseMicStream();
      setPhase("idle");
      setError(message);
    },
    [clearSilenceTimer, releaseMicStream, resetConversationState, stopRecognitionOnly],
  );

  const stopMic = useCallback(async () => {
    resetConversationState();
    clearSilenceTimer();
    stopRecognitionOnly();

    if (usingServerSttRef.current && mediaRecorderRef.current?.state === "recording") {
      setPhase("transcribing");
      const recorder = mediaRecorderRef.current;
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
      const blob = new Blob(mediaChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });
      mediaChunksRef.current = [];
      if (blob.size >= 1024) {
        const transcript = await transcribeWithServerStt({
          blob,
          mimeType: recorder.mimeType,
          language: toSttLanguage(langRef.current),
        });
        if (transcript) {
          applyDetectedLang(transcript);
          onTranscriptRef.current?.(transcript, true);
          scheduleAutoSend(transcript);
        } else {
          setError("Server speech-to-text unavailable");
        }
      }
    }

    usingServerSttRef.current = false;
    mediaRecorderRef.current = null;
    releaseMicStream();
    setPhase("idle");
  }, [
    applyDetectedLang,
    clearSilenceTimer,
    releaseMicStream,
    resetConversationState,
    scheduleAutoSend,
    stopRecognitionOnly,
  ]);

  const startBrowserRecognition = useCallback(
    (stream: MediaStream) => {
      const SR: any =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.continuous = continuous || conversationActiveRef.current;
      rec.interimResults = true;
      rec.lang = toSpeechLocale(langRef.current);
      transcriptBufferRef.current = "";

      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) transcriptBufferRef.current += `${r[0].transcript} `;
          else interim += r[0].transcript;
        }
        const combined = (transcriptBufferRef.current + interim).trim();
        if (!combined) return;

        if (bargeInActiveRef.current && isStopPhrase(combined)) {
          dispatchVoiceControl(combined);
          return;
        }
        if (bargeInActiveRef.current) return;

        if (listeningPausedRef.current) return;
        applyDetectedLang(combined);
        const isFinal = !interim;
        onTranscriptRef.current?.(combined, isFinal);
        if (isFinal) scheduleAutoSend(transcriptBufferRef.current.trim() || combined);
      };

      rec.onend = () => {
        recogRef.current = null;
        if (
          conversationActiveRef.current &&
          !pausedForSpeechRef.current &&
          !listeningPausedRef.current
        ) {
          void startMicInternalRef.current();
          return;
        }
        if (!pausedForSpeechRef.current) {
          releaseMicStream();
          setPhase((p) => (p === "speaking" ? "speaking" : "idle"));
        }
      };

      rec.onerror = (event: any) => {
        const code = event?.error;
        if (code === "no-speech" || code === "aborted") {
          if (
            conversationActiveRef.current &&
            !pausedForSpeechRef.current &&
            !listeningPausedRef.current
          ) {
            void startMicInternalRef.current();
          }
          return;
        }
        if (code === "not-allowed") {
          failMicStart("Microphone permission denied — tap the mic button to allow access.");
          return;
        }
        failMicStart(code === "network" ? "Speech network error" : "Speech input error");
      };

      recogRef.current = rec;
      rec.start();
    },
    [applyDetectedLang, continuous, releaseMicStream, scheduleAutoSend],
  );

  const startMicInternal = useCallback(async () => {
    if (listeningPausedRef.current || pausedForSpeechRef.current) return;
    setError(null);

    let stream = streamRef.current;
    if (!stream || stream.getTracks().every((track) => track.readyState === "ended")) {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone not supported");
      }
      await ensureAudioContext();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
    }

    setMicStream(stream);
    setPhase("listening");

    if (speechRecognitionSupported()) {
      startBrowserRecognition(stream);
      return;
    }

    if (mediaRecorderSupported()) {
      usingServerSttRef.current = true;
      const mimeType =
        ["audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      return;
    }

    throw new Error("Speech input not supported in this browser");
  }, [startBrowserRecognition]);

  startMicInternalRef.current = async () => {
    try {
      await startMicInternal();
    } catch (e) {
      failMicStart(e instanceof Error ? e.message : "Microphone permission denied");
    }
  };

  const pauseListening = useCallback(async () => {
    listeningPausedRef.current = true;
    clearSilenceTimer();
    stopRecognitionOnly();
    if (usingServerSttRef.current && mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    usingServerSttRef.current = false;
    mediaRecorderRef.current = null;
  }, [clearSilenceTimer, stopRecognitionOnly]);

  const resumeListening = useCallback(async () => {
    if (!conversationActiveRef.current || !conversationMode) return;
    listeningPausedRef.current = false;
    pausedForSpeechRef.current = false;
    autoSendFiredRef.current = "";
    await startMicInternalRef.current();
  }, [conversationMode]);

  const startConversation = useCallback(async () => {
    conversationActiveRef.current = true;
    setConversationActive(true);
    pausedForSpeechRef.current = false;
    listeningPausedRef.current = false;
    autoSendFiredRef.current = "";
    pendingUtteranceRef.current = "";
    await startMicInternalRef.current();
  }, []);

  const stopConversation = useCallback(async () => {
    await stopMic();
  }, [stopMic]);

  const startMic = useCallback(async () => {
    if (conversationMode) {
      await startConversation();
      return;
    }
    await startMicInternalRef.current();
  }, [conversationMode, startConversation]);

  const toggleMic = useCallback(async () => {
    if (conversationMode) {
      if (conversationActiveRef.current) await stopConversation();
      else await startConversation();
      return;
    }
    if (micActive) await stopMic();
    else await startMic();
  }, [conversationMode, micActive, startConversation, startMic, stopConversation, stopMic]);

  const setConversationMode = useCallback((on: boolean) => {
    setConversationModeState(on);
    saveVoicePrefs({ conversationMode: on });
    if (!on && conversationActiveRef.current) void stopConversation();
  }, [stopConversation]);

  const setSpeakerOn = useCallback((on: boolean) => {
    setSpeakerOnState(on);
    saveVoicePrefs({ speakerOn: on });
    if (!on) {
      speakAbortRef.current += 1;
      try {
        audioRef.current?.pause();
      } catch {}
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingAudio(null);
      pausedForSpeechRef.current = false;
      if (conversationActiveRef.current) void resumeListening();
      else setPhase((p) => (p === "speaking" ? "idle" : p));
    }
  }, [resumeListening]);

  const stopSpeaking = useCallback(() => {
    interruptSpeaking();
    if (conversationActiveRef.current) void resumeListening();
  }, [interruptSpeaking, resumeListening]);

  const speakText = useCallback(
    async (text: string, speakLang?: string) => {
      if (!speakerOn || !text.trim()) return;
      const token = ++speakAbortRef.current;
      clearSilenceTimer();

      const wasListening = conversationActiveRef.current && !listeningPausedRef.current;
      if (wasListening) {
        pausedForSpeechRef.current = true;
        bargeInActiveRef.current = false;
        await pauseListening();
      }

      setPhase("speaking");
      const langCode = speakLang ?? langRef.current;
      await speakPersonaText(
        text,
        langCode,
        (audio) => {
          if (token !== speakAbortRef.current) return;
          audioRef.current = audio;
          setSpeakingAudio(audio);
        },
        (persona) => {
          if (token !== speakAbortRef.current) return;
          setActivePersona(persona);
        },
        () => token !== speakAbortRef.current,
      );

      if (token !== speakAbortRef.current) return;
      setSpeakingAudio(null);
      setActivePersona(null);
      releaseOutputAnalyser();
      bargeInActiveRef.current = false;
      pausedForSpeechRef.current = false;

      if (conversationActiveRef.current && conversationMode) {
        await resumeListening();
      } else {
        setPhase("idle");
      }
    },
    [clearSilenceTimer, conversationMode, pauseListening, resumeListening, speakerOn],
  );

  useEffect(() => {
    return () => {
      conversationActiveRef.current = false;
      clearSilenceTimer();
      stopRecognitionOnly();
      releaseMicStream();
      speakAbortRef.current += 1;
      try {
        audioRef.current?.pause();
      } catch {}
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearSilenceTimer, releaseMicStream, stopRecognitionOnly]);

  return {
    phase,
    micStream,
    micActive,
    speakerOn,
    conversationMode,
    handsFreeActive,
    speakingAudio,
    activePersona,
    error,
    toggleMic,
    setSpeakerOn,
    toggleSpeaker: () => setSpeakerOn(!speakerOn),
    setConversationMode,
    startConversation,
    stopConversation,
    speakText,
    stopSpeaking,
    interrupt: stopSpeaking,
    startMic,
    stopMic,
  };
}
