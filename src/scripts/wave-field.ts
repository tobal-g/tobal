const CHARS = " .·-~=+*#";
const CHAR_SIZE = 14;
const BASE_OPACITY = 0.07;
const CURSOR_BOOST = 0.18;
const CURSOR_RADIUS = 180;
const LERP = 0.06;

interface Wave {
  freqX: number;
  freqY: number;
  speed: number;
  phase: number;
  amplitude: number;
}

const WAVES: Wave[] = [
  { freqX: 0.025, freqY: 0.03, speed: 0.008, phase: 0, amplitude: 1 },
  { freqX: 0.04, freqY: 0.015, speed: -0.012, phase: 2.1, amplitude: 0.7 },
  { freqX: 0.018, freqY: 0.045, speed: 0.006, phase: 4.2, amplitude: 0.8 },
  { freqX: 0.05, freqY: 0.02, speed: -0.01, phase: 1.0, amplitude: 0.5 },
];

export function initWaveField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let cols = 0;
  let rows = 0;
  let time = 0;
  let mouseX = -1000;
  let mouseY = -1000;
  let smoothMouseX = -1000;
  let smoothMouseY = -1000;
  let animationId: number;
  let dpr = 1;
  let width = 0;
  let height = 0;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    cols = Math.ceil(width / CHAR_SIZE) + 1;
    rows = Math.ceil(height / CHAR_SIZE) + 1;
  }

  function sample(x: number, y: number, t: number): number {
    let sum = 0;
    let ampSum = 0;
    for (const w of WAVES) {
      sum +=
        Math.sin(x * w.freqX + y * w.freqY + t * w.speed + w.phase) *
        w.amplitude;
      ampSum += w.amplitude;
    }
    return (sum / ampSum + 1) / 2; // normalize to 0..1
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${CHAR_SIZE}px "IBM Plex Mono", monospace`;
    ctx.textBaseline = "top";

    // Smooth cursor
    smoothMouseX += (mouseX - smoothMouseX) * LERP;
    smoothMouseY += (mouseY - smoothMouseY) * LERP;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * CHAR_SIZE;
        const y = row * CHAR_SIZE;

        const val = sample(x, y, time);
        const charIdx = Math.floor(val * (CHARS.length - 1));
        const char = CHARS[charIdx];

        if (char === " ") continue;

        // Cursor influence
        const dx = smoothMouseX - x;
        const dy = smoothMouseY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cursorInfluence = Math.max(0, 1 - dist / CURSOR_RADIUS);
        const eased = cursorInfluence * cursorInfluence;

        const opacity = BASE_OPACITY + eased * CURSOR_BOOST;

        // Color: neutral base, teal near cursor
        if (eased > 0.01) {
          ctx.fillStyle = `rgba(61, 163, 150, ${opacity + eased * 0.15})`;
        } else {
          ctx.fillStyle = `rgba(160, 160, 158, ${opacity})`;
        }

        ctx.fillText(char, x, y);
      }
    }
  }

  function animate() {
    time += 1;
    draw();
    animationId = requestAnimationFrame(animate);
  }

  function onPointerMove(e: PointerEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function onPointerLeave() {
    mouseX = -1000;
    mouseY = -1000;
  }

  function onResize() {
    cancelAnimationFrame(animationId);
    resize();
    if (!prefersReducedMotion) {
      animate();
    } else {
      draw();
    }
  }

  // Init
  resize();

  if (prefersReducedMotion) {
    time = 50; // offset so it's not blank
    draw();
  } else {
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerleave", onPointerLeave);
    animate();
  }

  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onResize, 150);
  });
}
