// Shared across mounted screens: acquire before any asynchronous journal read.
const activeSubmissions = new Set<string>();

export function acquireSubmission(key: string): (() => void) | null {
  if (activeSubmissions.has(key)) return null;
  activeSubmissions.add(key);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeSubmissions.delete(key);
  };
}
