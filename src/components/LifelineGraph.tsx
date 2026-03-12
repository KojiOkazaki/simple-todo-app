import type { LifelineItem } from '../lib/constants';

interface LifelineGraphProps {
  data: LifelineItem[];
}

export function LifelineGraph({ data }: LifelineGraphProps) {
  const width = 500;
  const height = 160;
  const padding = 20;
  const xStep = (width - padding * 2) / (data.length - 1);

  const points = data
    .map((item, index) => {
      const x = padding + index * xStep;
      const y = height / 2 - (item.score / 100) * (height / 2 - padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 relative">
      <h4 className="text-sm font-bold text-slate-600 mb-2 absolute top-4 left-4">
        モチベーションの推移
      </h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32 overflow-visible">
        <line x1="0" y1={padding} x2={width} y2={padding} stroke="#e2e8f0" strokeDasharray="4 4" />
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#cbd5e1" strokeWidth="2" />
        <line
          x1="0"
          y1={height - padding}
          x2={width}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeDasharray="4 4"
        />
        <text x="0" y={padding + 4} fontSize="10" fill="#64748b">
          +100
        </text>
        <text x="0" y={height / 2 + 4} fontSize="10" fill="#64748b">
          0
        </text>
        <text x="0" y={height - padding + 4} fontSize="10" fill="#64748b">
          -100
        </text>
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" />
        {data.map((item, index) => {
          const x = padding + index * xStep;
          const y = height / 2 - (item.score / 100) * (height / 2 - padding);
          return (
            <g key={item.id}>
              <circle cx={x} cy={y} r="5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <text
                x={x}
                y={height + 15}
                fontSize="12"
                fill="#475569"
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.period}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
