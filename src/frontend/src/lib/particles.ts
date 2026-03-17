export function emitXPGain(x: number, y: number): void {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'xp-particle';
    el.textContent = '+XP';
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      font-size: 12px;
      font-weight: bold;
      color: var(--oav-accent, #22d3ee);
      animation: float-up 0.8s ease-out forwards;
      animation-delay: ${i * 0.08}s;
      transform: translateX(${(Math.random() - 0.5) * 40}px);
      z-index: 9999;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000 + i * 80);
  }
}
