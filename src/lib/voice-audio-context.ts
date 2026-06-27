/** Shared Web Audio graph — one context, separate mic/output analysers. */

let sharedCtx: AudioContext | null = null;

let micSource: MediaStreamAudioSourceNode | null = null;
let micAnalyser: AnalyserNode | null = null;
let micStreamRef: MediaStream | null = null;

let outputAnalyser: AnalyserNode | null = null;
let outputSource: MediaStreamAudioSourceNode | null = null;
let outputStreamRef: MediaStream | null = null;
let outputElement: HTMLAudioElement | null = null;

function getContext(): AudioContext {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AC();
  }
  return sharedCtx;
}

/** Resume AudioContext after a user gesture (mic button). */
export async function ensureAudioContext(): Promise<AudioContext> {
  const ctx = getContext();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
  return ctx;
}

export function getMicAnalyser(stream: MediaStream | null): AnalyserNode | null {
  if (!stream || stream.getTracks().every((t) => t.readyState === "ended")) return null;

  if (micStreamRef === stream && micAnalyser) {
    void ensureAudioContext();
    return micAnalyser;
  }

  try {
    const ctx = getContext();
    void ctx.resume().catch(() => undefined);

    if (micStreamRef !== stream) {
      try {
        micSource?.disconnect();
      } catch {}
      micSource = ctx.createMediaStreamSource(stream);
      micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 256;
      micAnalyser.smoothingTimeConstant = 0.72;
      micSource.connect(micAnalyser);
      micStreamRef = stream;
    }

    return micAnalyser;
  } catch (err) {
    console.warn("[voice-audio] mic analyser failed", err);
    return null;
  }
}

/** Real output levels from TTS `<audio>` via captureStream — does not reroute playback. */
export function getOutputAnalyser(audio: HTMLAudioElement | null): AnalyserNode | null {
  if (!audio) return null;

  try {
    const capture = (
      audio as HTMLAudioElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }
    ).captureStream?.() ??
      (audio as HTMLAudioElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();

    if (!capture) return null;

    if (outputElement === audio && outputStreamRef === capture && outputAnalyser) {
      void ensureAudioContext();
      return outputAnalyser;
    }

    const ctx = getContext();
    void ctx.resume().catch(() => undefined);

    try {
      outputSource?.disconnect();
    } catch {}

    outputSource = ctx.createMediaStreamSource(capture);
    outputAnalyser = ctx.createAnalyser();
    outputAnalyser.fftSize = 256;
    outputAnalyser.smoothingTimeConstant = 0.72;
    outputSource.connect(outputAnalyser);
    outputElement = audio;
    outputStreamRef = capture;

    return outputAnalyser;
  } catch (err) {
    console.warn("[voice-audio] output analyser failed", err);
    return null;
  }
}

export function releaseOutputAnalyser() {
  try {
    outputSource?.disconnect();
  } catch {}
  outputSource = null;
  outputAnalyser = null;
  outputStreamRef = null;
  outputElement = null;
}

export function releaseMicAnalyser() {
  try {
    micSource?.disconnect();
  } catch {}
  micSource = null;
  micAnalyser = null;
  micStreamRef = null;
}
