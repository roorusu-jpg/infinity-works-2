let audioContext;
let activeSources = [];

export function playElectricCrackle(volume = 0.34) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();

    const play = () => {
      const sampleRate = audioContext.sampleRate;
      const duration = 2.1;
      const length = Math.floor(sampleRate * duration);
      const buffer = audioContext.createBuffer(1, length, sampleRate);
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

      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      gain.gain.value = Math.max(0, Math.min(1, volume));
      source.connect(gain);
      gain.connect(audioContext.destination);
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

    if (audioContext.state === "suspended") {
      audioContext.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // Audio is an enhancement; mining and energy production must still work.
  }
}
