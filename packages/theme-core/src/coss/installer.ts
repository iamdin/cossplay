import pLimit from 'p-limit';

// Serializes USER-origin sheet replacement. `installed` only changes once the worker
// acknowledges it, so a failed replacement still knows which sheet to remove later.
export function cssInstaller(send: (css: string, previous: string) => Promise<void>, settled: () => void) {
  let installed = '', requested = '';
  const queue = pLimit(1);
  // Detection must know whether USER CSS is, or is about to be, applied to computed styles.
  const active = () => requested !== '' || installed !== '';
  function install(css: string) {
    if (requested === css) return;
    requested = css;
    queue(async () => {
      try {
        if (installed !== css) { await send(css, installed); installed = css; }
      } catch (error) {
        // Allow an identical later request to retry unless a newer one is already queued.
        if (requested === css) requested = installed;
        console.error('coss tweak CSS injection failed', error);
      }
      settled();
    });
  }
  return { install, active };
}
