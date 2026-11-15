let audioContext;
let activeSources = [];

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ||= new AudioContextClass();
  return audioContext;
}

function unlockElectricAudio() {
  try {
    const context = getAudioContext();
    if (!context) return;
    // iOS Safari needs a tiny sound started directly inside a user gesture
    // before later game events can play Web Audio.
    const buffer = context.createBuffer(1, 1, context.sampleRate);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    if (context.state !== "running") context.resume().catch(() => {});
  } catch {}
}

if (typeof document !== "undefined") {
  // Keep these listeners active: mobile browsers may suspend audio again.
  document.addEventListener("pointerdown", unlockElectricAudio, { passive: true });
  document.addEventListener("touchend", unlockElectricAudio, { passive: true });
  document.addEventListener("keydown", unlockElectricAudio);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) unlockElectricAudio();
  });
  window.addEventListener("pageshow", unlockElectricAudio);
}

export function playElectricCrackle(volume = 0.34) {
  try {
    const context = getAudioContext();
    if (!context) return;

    const play = () => {
      const sampleRate = context.sampleRate;
      const duration = 2.1;
      const length = Math.floor(sampleRate * duration);
      const buffer = context.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      let seed = 417;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 1073741823 - 1;
      };
      const events = [
        [0.035, 0.030, 0.95],
        [0.082, 0.055, 0.72],
        [0.155, 0.040, 0.82],
        [0.235, 0.075, 0.60],
        [0.365, 0.050, 0.44]
      ];
      const noise = new Float32Array(length);
      for (let i = 0; i < length; i++) noise[i] = random();

      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const previous = noise[Math.max(0, i - 1)];
        const next = noise[Math.min(length - 1, i + 1)];
        const smoothNoise = noise[i] * 0.5 + previous * 0.25 + next * 0.25;
        const pulse = 0.72 + 0.28 * Math.pow(Math.sin(2 * Math.PI * 13 * time + 0.7), 2);
        const tail = Math.exp(-Math.max(0, time - 0.28) / 0.62) *
          (1 - Math.exp(-Math.max(0, time - 0.28) / 0.012));
        let sample = time >= 0.28 ? 0.36 * smoothNoise * pulse * tail : 0;

        for (const [start, span, amplitude] of events) {
          const elapsed = time - start;
          if (elapsed >= 0 && elapsed <= span) {
            const envelope = (1 - Math.exp(-elapsed / 0.0015)) *
              Math.exp(-elapsed / (span * 0.45));
            const bright = noise[i] - previous * 0.55;
            const ring = Math.sin(2 * Math.PI * (3200 - 900 * elapsed / span) * elapsed);
            sample += amplitude * envelope * (0.82 * bright + 0.20 * ring);
          }
        }

        const ticks = [[0.55, 0.10], [0.73, 0.075], [0.98, 0.06], [1.27, 0.045], [1.58, 0.028]];
        for (const [start, amplitude] of ticks) {
          const elapsed = time - start;
          if (elapsed >= 0 && elapsed < 0.018) {
            sample += amplitude * noise[i] * Math.exp(-elapsed / 0.006);
          }
        }

        const fadeIn = Math.min(1, time / 0.004);
        const fadeOut = Math.min(1, (duration - time) / 0.24);
        data[i] = sample * fadeIn * fadeOut * 0.82;
      }

      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = Math.max(0, Math.min(1, volume));
      source.connect(gain);
      gain.connect(context.destination);
      activeSources = activeSources.filter(item => item.playing);
      if (activeSources.length >= 2) {
        try { activeSources[0].stop(); } catch {}
        activeSources.shift();
      }
      const entry = { source, playing: true };
      activeSources.push(entry);
      source.onended = () => {
        entry.playing = false;
        activeSources = activeSources.filter(item => item !== entry);
      };
      source.start();
    };

    if (context.state === "suspended") {
      context.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // Audio is an enhancement; mining and energy production must still work.
  }
}


/**
 * Plays a short diagnostic tone directly from a user-initiated action.
 * Kept separate from the electric crackle to isolate browser audio permission issues.
 */
export async function testElectricAudio() {
  try {
    const context = getAudioContext();
    if (!context) {
      return { ok: false, state: "unsupported", reason: "このブラウザーはWeb Audioに対応していません。" };
    }
    if (context.state !== "running") await context.resume();
    if (context.state !== "running") {
      return { ok: false, state: context.state, reason: "ブラウザーが音声再生を開始できませんでした。" };
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.025);
    gain.gain.setTargetAtTime(0.0001, now + 0.12, 0.055);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.38);
    return { ok: true, state: context.state, reason: "" };
  } catch (error) {
    let state = "error";
    try { state = audioContext?.state || state; } catch {}
    return {
      ok: false,
      state,
      reason: error instanceof Error ? error.message : "不明な音声エラーが発生しました。"
    };
  }
}
