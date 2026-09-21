async function loadSource() {
  const response = await fetch(new URL('./assets/flappy-pope-v4.svg', import.meta.url));
  if (!response.ok) throw new Error('Logo animation unavailable.');
  const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
  if (source.querySelector('parsererror') || source.documentElement.localName !== 'svg') {
    throw new Error('Invalid logo animation.');
  }
  return source.documentElement;
}

export function setupBrandAnimation(button, {load = loadSource} = {}) {
  const doc = button.ownerDocument, view = doc.defaultView;
  const icon = button.querySelector('.brand-mark');
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let layer, playing = false, initialPending = true, finishTimer;

  function stop() {
    view.clearTimeout(finishTimer);
    playing = false;
    layer?.removeAttribute('data-playing');
  }
  function play() {
    if (!layer || playing || doc.hidden || reducedMotion.matches) return;
    // Recreate the CSS timeline, keeping the same artwork visible between plays.
    layer.removeAttribute('data-playing');
    layer.getBoundingClientRect();
    layer.setAttribute('data-playing', '');
    playing = true;
    initialPending = false;
    finishTimer = view.setTimeout(stop, 4000);
  }
  function playInitial() { if (initialPending) play(); }

  button.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') play();
  });
  // A real button makes touch and keyboard activation replay without navigating.
  button.addEventListener('click', play);
  button.addEventListener('focusin', () => {
    if (button.matches(':focus-visible')) play();
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) stop();
    else playInitial();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stop();
    else playInitial();
  });

  const ready = load().then(async source => {
    const host = doc.createElement('span');
    host.className = 'brand-motion';
    host.setAttribute('aria-hidden', 'true');
    const shadow = host.attachShadow({mode: 'open'});
    const style = doc.createElement('style');
    style.textContent = `
      :host { pointer-events: none; }
      svg { display: block; width: 100%; height: 100%; max-width: none; overflow: visible; }
      svg * { animation-iteration-count: 1 !important; }
      :host(:not([data-playing])) svg * { animation: none !important; }
    `;
    const svg = doc.importNode(source, true);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    shadow.append(style, svg);
    icon.append(host);
    // Resolve the SVG's initial layout before replacing the static fallback.
    await new Promise(resolve => view.requestAnimationFrame(() => view.requestAnimationFrame(resolve)));
    layer = host;
    icon.classList.add('is-ready');
    playInitial();
  }).catch(() => {
    // Keep the original static icon if loading the animation fails.
  });
  return {ready};
}
