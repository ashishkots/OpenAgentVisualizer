import { gsap } from 'gsap';
import { Graphics, Text, Container, type Ticker } from 'pixi.js';
import { PIXI_COLORS, LEVEL_RING_PIXI_COLORS } from '../../lib/colorTokens';

// GSAP PixiPlugin patch — use object properties directly on pixi display objects
// (PixiPlugin not imported to keep bundle lean; we tween .x/.y/.alpha/.scale directly)

/**
 * animateSafe — wraps all GSAP calls to skip animations when
 * prefers-reduced-motion is active.
 */
export function animateSafe(fn: () => gsap.core.Timeline | gsap.core.Tween | void): void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (query.matches) return;
  fn();
}

/**
 * XP floater animation: "+N XP" text rises and fades above an agent.
 * Batching: caller should sum deltas if called multiple times within 500ms.
 */
export function animateXPFloater(
  xp: number,
  x: number,
  y: number,
  effectsLayer: Container,
): void {
  animateSafe(() => {
    const text = new Text({
      text: `+${xp} XP`,
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        fontWeight: '700',
        fill: PIXI_COLORS.xp,
        align: 'left',
      },
    });
    text.x = x - text.width / 2;
    text.y = y - 10;
    text.alpha = 1;
    effectsLayer.addChild(text);

    gsap
      .timeline()
      .to(text, { y: y - 50, duration: 1.0, ease: 'power2.out' })
      .to(text, { alpha: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
        effectsLayer.removeChild(text);
        text.destroy();
      }}, 0.7);
  });
}

/**
 * Level-up celebration on the canvas.
 * Phase 1: scale pulse, Phase 2: particle burst, Phase 3: ring tween, Phase 4: floating text
 */
export function animateLevelUp(
  avatarContainer: Container,
  levelRing: Graphics,
  newLevel: number,
  effectsLayer: Container,
): void {
  animateSafe(() => {
    const newColor = LEVEL_RING_PIXI_COLORS[newLevel] ?? PIXI_COLORS.gold;
    const tl = gsap.timeline();

    // Phase 1: Scale pulse (0–600ms)
    tl.to(avatarContainer.scale, { x: 1.3, y: 1.3, duration: 0.3, ease: 'power2.out' })
      .to(avatarContainer.scale, { x: 1.0, y: 1.0, duration: 0.3, ease: 'elastic.out(1, 0.5)' });

    // Phase 2: Particle burst (concurrent, 0–800ms)
    tl.add(() => spawnParticleBurst(avatarContainer.x, avatarContainer.y, 20, newColor, effectsLayer), 0);

    // Phase 3: Ring color tween (200–600ms) — apply after delay via callback
    // PixiPlugin not imported to avoid bundle overhead; tint updates via update() call
    tl.add(() => {
      levelRing.tint = newColor;
    }, 0.4);

    // Phase 4: Floating level text (400–1500ms)
    tl.add(() => {
      const label = new Text({
        text: `Level ${newLevel}!`,
        style: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 16,
          fontWeight: '700',
          fill: PIXI_COLORS.gold,
          align: 'center',
        },
      });
      label.anchor.set(0.5);
      label.x = avatarContainer.x;
      label.y = avatarContainer.y - 20;
      effectsLayer.addChild(label);
      gsap.to(label, {
        y: avatarContainer.y - 50,
        alpha: 0,
        duration: 1.1,
        ease: 'power2.out',
        onComplete: () => {
          effectsLayer.removeChild(label);
          label.destroy();
        },
      });
    }, 0.4);
  });
}

/**
 * Spawn particle burst at world position.
 */
export function spawnParticleBurst(
  x: number,
  y: number,
  count: number,
  color: number,
  effectsLayer: Container,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const velocity = 60 + Math.random() * 60;
    const radius = 2 + Math.random() * 2;

    const particle = new Graphics();
    particle.circle(0, 0, radius).fill({ color });
    particle.x = x;
    particle.y = y;
    particle.alpha = 1;
    effectsLayer.addChild(particle);

    const targetX = x + Math.cos(angle) * velocity;
    const targetY = y + Math.sin(angle) * velocity;

    gsap.to(particle, {
      x: targetX,
      y: targetY,
      alpha: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        effectsLayer.removeChild(particle);
        particle.destroy();
      },
    });
  }
}

/**
 * State transition crossfade — fade status dot color.
 */
export function animateStatusTransition(
  statusDot: Graphics,
  newColor: number,
): void {
  animateSafe(() => {
    gsap.to(statusDot, {
      pixi: { tint: newColor },
      duration: 0.3,
      ease: 'power2.inOut',
    });
  });
}

/**
 * Agent movement interpolation — smooth position change.
 */
export function animateAgentMove(
  container: Container,
  toX: number,
  toY: number,
): void {
  animateSafe(() => {
    gsap.to(container, {
      x: toX,
      y: toY,
      duration: 0.5,
      ease: 'power2.inOut',
    });
  });
}

/**
 * Error shake animation on agent sprite.
 */
export function animateError(container: Container): void {
  animateSafe(() => {
    const originalX = container.x;
    gsap.timeline()
      .to(container, { x: originalX + 3, duration: 0.05 })
      .to(container, { x: originalX - 3, duration: 0.05 })
      .to(container, { x: originalX + 3, duration: 0.05 })
      .to(container, { x: originalX - 3, duration: 0.05 })
      .to(container, { x: originalX, duration: 0.05 });
  });
}

/**
 * Idle breathing animation — slow scale pulse.
 */
export function startIdleBreathing(container: Container): gsap.core.Tween {
  return gsap.to(container.scale, {
    x: 1.02,
    y: 1.02,
    duration: 1.0,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  });
}

/**
 * Kill all tweens for a sprite (called on pool release).
 */
export function killSpriteTweens(target: Container): void {
  gsap.killTweensOf(target);
  gsap.killTweensOf(target.scale);
}

/**
 * Level 10 Transcendent screen flash.
 */
export function triggerScreenFlash(): void {
  animateSafe(() => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(255,255,255,0.3);
      z-index: 80;
      pointer-events: none;
      transition: opacity 500ms ease-out;
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    });
  });
}
