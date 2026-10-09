// Tracks whether the app is mid-handoff to the external wallet app (Mobile Wallet Adapter backgrounds
// Searix Trade for every authorize/sign call). AppLockGate reads this to tell "the user switched to
// another app" apart from "we ourselves briefly backgrounded to talk to the wallet" -- without it, every
// wallet round-trip would re-trigger the biometric lock the moment control returns.
let activeCount = 0;
let lastEndedAt = 0;
const GRACE_MS = 1500; // covers the gap between the wallet handoff finishing and the OS's foreground event

export function beginWalletInteraction() {
  activeCount += 1;
}

export function endWalletInteraction() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) lastEndedAt = Date.now();
}

export function isWalletInteractionActive(): boolean {
  return activeCount > 0 || Date.now() - lastEndedAt < GRACE_MS;
}
