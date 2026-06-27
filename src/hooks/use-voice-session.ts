import { useCallback, useEffect, useRef, useState } from "react";
import { toSpeechLocale, toSttLanguage } from "@/lib/voice-locale";
import { loadVoicePrefs, saveVoicePrefs } from "@/lib/voice-prefs";
import { playServerTts, speakLocally } from "@/lib/voice-tts-client";
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
  /** Called with final or interim transcript text */
  onTranscript?: (text: string, final: boolean) => void;
  /** Push-to-talk: auto-stop after silence (browser SR only) */
  autoStop?: boolean;
};

export function useVoiceSession(options: Options) {
  const { lang, continuous = true, onTranscript, autoStop = false } = options;
  const langRef = useRef(lang);
  langRef.current = lang;

  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [speakerOn, setSpeakerOnState] = useState(() => loadVoicePrefs().speakerOn);
  const [error, setError] = useState<string | null>(null);
  const [speakingAudio, setSpeakingAudio] = useState<HTMLAudioElement | null>(null);

  const recogRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const usingServerSttRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakAbortRef = useRef(0);

  const micActive = phase === "listening" || phase === "transcribing";

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
      setPhase((p) => (p === "speaking" ? "idle" : p));
    }
  }, []);

  const stopMic = useCallback(async () => {
    try {
      recogRef.current?.stop?.();
    } catch {}
    recogRef.current = null;

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
        if (transcript) onTranscript?.(transcript, true);
        else setError("Server speech-to-text unavailable");
      }
    }

    usingServerSttRef.current = false;
    mediaRecorderRef.current = null;
    micStream?.getTracks().forEach((t) => t.stop());
    setMicStream(null);
    setPhase((p) => (p === "transcribing" ? "idle" : "idle"));
  }, [micStream, onTranscript]);

  const startMic = useCallback(async () => {
    setError(null);
    let stream: MediaStream | null = null;
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone not supported");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setMicStream(stream);
      setPhase("listening");

      const SR: any = speechRecognitionSupported()
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

      if (SR) {
        const rec = new SR();
        rec.continuous = continuous;
        rec.interimResults = true;
        rec.lang = toSpeechLocale(langRef.current);
        let finalBuf = "";
        rec.onresult = (e: any) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalBuf += r[0].transcript + " ";
            else interim += r[0].transcript;
          }
          const combined = (finalBuf + interim).trim();
          if (combined) onTranscript?.(combined, !interim);
        };
        rec.onend = () => {
          setPhase("idle");
          stream?.getTracks().forEach((t) => t.stop());
          setMicStream(null);
        };
        rec.onerror = () => {
          setPhase("idle");
          stream?.getTracks().forEach((t) => t.stop());
          setMicStream(null);
        };
        recogRef.current = rec;
        rec.start();
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
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      setMicStream(null);
      setPhase("idle");
      setError(e instanceof Error ? e.message : "Microphone permission denied");
    }
  }, [continuous, onTranscript]);

  const toggleMic = useCallback(async () => {
    if (micActive) await stopMic();
    else await startMic();
  }, [micActive, startMic, stopMic]);

  const stopSpeaking = useCallback(() => {
    speakAbortRef.current += 1;
    try {
      audioRef.current?.pause();
    } catch {}
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingAudio(null);
    setPhase("idle");
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      if (!speakerOn || !text.trim()) return;
      const token = ++speakAbortRef.current;
      setPhase("speaking");
      const ok = await playServerTts(text, langRef.current, (audio) => {
        if (token !== speakAbortRef.current) return;
        audioRef.current = audio;
        setSpeakingAudio(audio);
      });
      if (token !== speakAbortRef.current) return;
      if (!ok) speakLocally(text, langRef.current);
      setSpeakingAudio(null);
      setPhase("idle");
    },
    [speakerOn],
  );

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.stop?.();
      } catch {}
      micStream?.getTracks().forEach((t) => t.stop());
      stopSpeaking();
    };
  }, []);

  return {
    phase,
    micStream,
    micActive,
    speakerOn,
    speakingAudio,
    error,
    toggleMic,
    setSpeakerOn,
    toggleSpeaker: () => setSpeakerOn(!speakerOn),
    speakText,
    stopSpeaking,
    startMic,
    stopMic,
  };
}
