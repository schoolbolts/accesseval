'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  score: number;
}

interface ScoreTrendProps {
  data: DataPoint[];
}

export default function ScoreTrend({ data }: ScoreTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-body">
        No score history yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'var(--font-outfit)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: '#94a3b8', fontFamily: 'var(--font-outfit)' }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            fontFamily: 'var(--font-outfit)',
            boxShadow: '0 4px 12px rgba(15, 23, 41, 0.06)',
          }}
          formatter={(value) => [value, 'Score']}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#059669"
          strokeWidth={2}
          dot={{ r: 3, fill: '#059669', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#047857' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
