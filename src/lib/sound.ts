let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playNotifSound() {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain).connect(c.destination);
    osc.frequency.setValueAtTime(880, c.currentTime);
    osc.frequency.setValueAtTime(1100, c.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
    osc.start(); osc.stop(c.currentTime + 0.5);
  } catch {}
}

export function unlockAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}
