(() => {
  const canvas = document.getElementById('hero-ripple-canvas');
  const hero = document.getElementById('home');
  if (!canvas || !hero) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const ripples = [];
  const maxRipples = 9;
  const lifetime = 1050;
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastMove = 0;
  let lastFrame = 0;

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const addRipple = (clientX, clientY, strength = 1) => {
    const bounds = hero.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;
    if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) return;
    ripples.push({ x, y, born: performance.now(), strength });
    if (ripples.length > maxRipples) ripples.shift();
    if (!frame) frame = requestAnimationFrame(draw);
  };

  const draw = (now) => {
    frame = 0;
    const delta = Math.min(32, now - (lastFrame || now));
    lastFrame = now;
    context.clearRect(0, 0, width, height);

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const ripple = ripples[i];
      const progress = (now - ripple.born) / lifetime;
      if (progress >= 1) {
        ripples.splice(i, 1);
        continue;
      }

      const eased = 1 - Math.pow(1 - progress, 2);
      const radius = 8 + eased * 86;
      const alpha = (1 - progress) * .16 * ripple.strength;
      context.lineWidth = 1;
      context.strokeStyle = 'rgba(140, 228, 194, ' + alpha + ')';
      context.beginPath();
      context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = 'rgba(129, 140, 248, ' + (alpha * .48) + ')';
      context.beginPath();
      context.arc(ripple.x, ripple.y, radius * .72, 0, Math.PI * 2);
      context.stroke();
    }

    if (ripples.length) frame = requestAnimationFrame(draw);
    else lastFrame = 0;
  };

  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - lastMove < 95) return;
    lastMove = now;
    addRipple(event.clientX, event.clientY, .72);
  };

  const onPointerDown = (event) => {
    addRipple(event.clientX, event.clientY, 1);
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(hero);
  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('resize', resize, { passive: true });

  motionPreference.addEventListener?.('change', (event) => {
    if (event.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      ripples.length = 0;
      context.clearRect(0, 0, width, height);
    }
  });

  window.addEventListener('pagehide', () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
  }, { once: true });
})();
