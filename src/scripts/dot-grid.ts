interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  targetRadius: number;
  targetOpacity: number;
  targetX: number;
  targetY: number;
}

const LERP_FACTOR = 0.08;
const BASE_RADIUS = 1.5;
const MAX_RADIUS = 4;
const BASE_OPACITY = 0.12;
const MAX_OPACITY = 0.6;
const INFLUENCE_RADIUS = 120;
const DISPLACEMENT = 8;

export function initDotGrid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let dots: Dot[] = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let animationId: number;
  let spacing: number;

  function getSpacing(): number {
    return window.innerWidth < 600 ? 32 : 24;
  }

  function createDots() {
    dots = [];
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    spacing = getSpacing();
    const cols = Math.floor(rect.width / spacing);
    const rows = Math.floor(rect.height / spacing);
    const offsetX = (rect.width - cols * spacing) / 2 + spacing / 2;
    const offsetY = (rect.height - rows * spacing) / 2 + spacing / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * spacing;
        const y = offsetY + row * spacing;
        dots.push({
          baseX: x,
          baseY: y,
          x,
          y,
          radius: BASE_RADIUS,
          opacity: BASE_OPACITY,
          targetRadius: BASE_RADIUS,
          targetOpacity: BASE_OPACITY,
          targetX: x,
          targetY: y,
        });
      }
    }
  }

  function updateDots() {
    for (const dot of dots) {
      const dx = mouseX - dot.baseX;
      const dy = mouseY - dot.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < INFLUENCE_RADIUS) {
        const t = 1 - dist / INFLUENCE_RADIUS;
        const eased = t * t;

        dot.targetRadius = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * eased;
        dot.targetOpacity = BASE_OPACITY + (MAX_OPACITY - BASE_OPACITY) * eased;

        const angle = Math.atan2(dy, dx);
        dot.targetX = dot.baseX - Math.cos(angle) * DISPLACEMENT * eased;
        dot.targetY = dot.baseY - Math.sin(angle) * DISPLACEMENT * eased;
      } else {
        dot.targetRadius = BASE_RADIUS;
        dot.targetOpacity = BASE_OPACITY;
        dot.targetX = dot.baseX;
        dot.targetY = dot.baseY;
      }

      dot.radius += (dot.targetRadius - dot.radius) * LERP_FACTOR;
      dot.opacity += (dot.targetOpacity - dot.opacity) * LERP_FACTOR;
      dot.x += (dot.targetX - dot.x) * LERP_FACTOR;
      dot.y += (dot.targetY - dot.y) * LERP_FACTOR;
    }
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    for (const dot of dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);

      const isInfluenced = dot.opacity > BASE_OPACITY + 0.02;
      if (isInfluenced) {
        ctx.fillStyle = `rgba(43, 138, 126, ${dot.opacity})`;
      } else {
        ctx.fillStyle = `rgba(100, 100, 98, ${dot.opacity})`;
      }

      ctx.fill();
    }
  }

  function animate() {
    updateDots();
    draw();
    animationId = requestAnimationFrame(animate);
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function onPointerLeave() {
    mouseX = -1000;
    mouseY = -1000;
  }

  function onResize() {
    cancelAnimationFrame(animationId);
    createDots();
    if (!prefersReducedMotion) {
      animate();
    } else {
      draw();
    }
  }

  // Initialize
  createDots();

  if (prefersReducedMotion) {
    draw();
  } else {
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    animate();
  }

  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onResize, 150);
  });
}
