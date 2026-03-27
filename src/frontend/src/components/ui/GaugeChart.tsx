import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { animateSafe } from '../../canvas/animations/gsapAnimations';
import type { SecurityGrade } from '../../types/security';

// π × radius = half-circumference of the SVG arc (radius=80)
const HALF_CIRC = 251.3;

const GRADE_ARC_COLOR: Record<SecurityGrade, string> = {
  A: '#22c55e',
  B: '#60a5fa',
  C: '#f59e0b',
  D: '#fb923c',
  F: '#ef4444',
};

const GRADE_TEXT_COLOR: Record<SecurityGrade, string> = {
  A: '#22c55e',
  B: '#60a5fa',
  C: '#f59e0b',
  D: '#fb923c',
  F: '#ef4444',
};

interface GaugeChartProps {
  score: number;
  grade: SecurityGrade;
  lastUpdated?: string;
  className?: string;
}

function scoreToGrade(score: number): SecurityGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export { scoreToGrade };

export function GaugeChart({ score, grade, lastUpdated, className }: GaugeChartProps) {
  const arcRef = useRef<SVGPathElement>(null);
  const prevScore = useRef<number>(0);

  const targetOffset = HALF_CIRC * (1 - score / 100);

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;

    const fromOffset = HALF_CIRC * (1 - prevScore.current / 100);

    animateSafe(() => {
      gsap.fromTo(
        arc,
        { strokeDashoffset: fromOffset },
        { strokeDashoffset: targetOffset, duration: 1.2, ease: 'power2.out' },
      );
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      arc.style.strokeDashoffset = String(targetOffset);
    }

    prevScore.current = score;
  }, [score, targetOffset]);

  const arcColor = GRADE_ARC_COLOR[grade];
  const textColor = GRADE_TEXT_COLOR[grade];

  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[240px] mx-auto"
        aria-hidden="true"
        role="img"
        aria-label={`Compliance score ${score}, grade ${grade}`}
      >
        {/* Background arc */}
        <path
          d="M 20,100 A 80,80 0 0,1 180,100"
          fill="none"
          stroke="#2d3748"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          ref={arcRef}
          d="M 20,100 A 80,80 0 0,1 180,100"
          fill="none"
          stroke={arcColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={HALF_CIRC}
          strokeDashoffset={HALF_CIRC}
          style={{ transition: 'stroke 0.4s ease' }}
        />
        {/* Score number */}
        <text
          x="100"
          y="88"
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill="#e2e8f0"
        >
          {score}
        </text>
        {/* Grade letter */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill={textColor}
        >
          Grade {grade}
        </text>
      </svg>

      {/* Grade scale */}
      <div className="flex gap-1 text-[10px] w-full justify-between px-2 max-w-[240px] mx-auto">
        <span className="text-oav-error">F</span>
        <span className="text-oav-shield">D</span>
        <span className="text-oav-warning">C</span>
        <span className="text-oav-knowledge">B</span>
        <span className="text-oav-success">A</span>
      </div>

      {lastUpdated && (
        <p className="text-xs text-oav-muted text-center mt-2">Last updated: {lastUpdated}</p>
      )}
    </div>
  );
}
