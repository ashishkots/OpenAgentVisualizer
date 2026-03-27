import { Fragment } from 'react';

interface Props {
  data: { hour: number; day: number; cost: number }[];
}

export function CostHeatmap({ data }: Props) {
  const max = Math.max(...data.map(d => d.cost), 0.001);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
        {days.map((day, d) => (
          <Fragment key={d}>
            <span className="text-oav-muted text-xs flex items-center">{day}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = data.find(x => x.day === d && x.hour === h);
              const intensity = cell ? cell.cost / max : 0;
              return (
                <div
                  key={h}
                  title={`${day} ${h}:00 — $${cell?.cost.toFixed(4) ?? '0'}`}
                  className="h-4 rounded-sm"
                  style={{ background: `rgba(99,102,241,${0.05 + intensity * 0.95})` }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
