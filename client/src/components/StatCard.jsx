import React from 'react';

export default function StatCard({
  title,
  value,
  trend = 'neutral',
  trendValue,
  className = '',
}) {
  const trendClass = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-neutral-500';
  const trendIcon = trend === 'up' ? 'TrendUp' : trend === 'down' ? 'TrendDown' : 'Minus';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <p className="text-sm text-neutral-500 uppercase tracking-wider mb-2">{title}</p>
      <p className="text-3xl font-bold text-neutral-900">{value}</p>
      {trendValue !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-medium ${trendClass}`}>
            <{trendIcon} className="h-3 w-3" /> {trendValue}%
          </span>
        </div>
      )}
    </div>
  );
}