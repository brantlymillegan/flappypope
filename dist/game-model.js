export const WORLD = { width: 640, height: 300, ground: 278, playerX: 150, radius: 9, gravity: 820, lift: -286, speed: 86, pipeWidth: 39, spacing: 173, gap: 82, minGap: 72 };
const GAP_BANDS = [[64, 92], [120, 158], [186, 214]];
export function createRun(random = Math.random) {
  return { status: 'ready', y: 134, velocity: 0, score: 0, elapsed: 0, distance: 0, pipes: [], random, gapBand: 1, flapAt: 0 };
}
export function flap(run) {
  if (run.status === 'ready') { run.status = 'playing'; run.pipes.push({ x: 390, center: 139, gap: WORLD.gap, passed: false }); }
  if (run.status !== 'playing') return;
  run.velocity = WORLD.lift;
  run.flapAt = run.elapsed;
}
export function advance(run, dt) {
  if (run.status !== 'playing' || dt <= 0) return { scored: false, collided: false };
  const beforeScore = run.score;
  run.elapsed += dt;
  run.velocity += WORLD.gravity * dt;
  run.y += run.velocity * dt;
  const speed = WORLD.speed + Math.min(run.score * .45, 18);
  run.distance += speed * dt;
  for (const pipe of run.pipes) pipe.x -= speed * dt;
  const last = run.pipes.at(-1);
  if (!last || last.x <= WORLD.width - WORLD.spacing) {
    // Switch altitude bands each time, with a fresh height inside the chosen band.
    run.gapBand = (run.gapBand + 1 + Math.floor(run.random() * 2)) % GAP_BANDS.length;
    const [minCenter, maxCenter] = GAP_BANDS[run.gapBand];
    const center = minCenter + run.random() * (maxCenter - minCenter);
    run.pipes.push({ x: last ? last.x + WORLD.spacing : WORLD.width + 20, center, gap: Math.max(WORLD.minGap, WORLD.gap - run.score * .4), passed: false });
  }
  run.pipes = run.pipes.filter(pipe => pipe.x > -WORLD.pipeWidth - 15);
  let collided = run.y - WORLD.radius <= 0 || run.y + WORLD.radius >= WORLD.ground;
  for (const pipe of run.pipes) {
    const overlapsX = WORLD.playerX + WORLD.radius > pipe.x - 4 && WORLD.playerX - WORLD.radius < pipe.x + WORLD.pipeWidth + 4;
    if (overlapsX && (run.y - WORLD.radius < pipe.center - pipe.gap / 2 || run.y + WORLD.radius > pipe.center + pipe.gap / 2)) collided = true;
  }
  if (collided) run.status = 'over';
  else for (const pipe of run.pipes) {
    if (!pipe.passed && pipe.x + WORLD.pipeWidth + 4 < WORLD.playerX - WORLD.radius) { pipe.passed = true; run.score++; }
  }
  return { scored: run.score > beforeScore, collided };
}
