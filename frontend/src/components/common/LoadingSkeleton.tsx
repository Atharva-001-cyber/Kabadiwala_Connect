import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'stat' | 'stats' | 'list' | 'detail';
  variant?: 'card' | 'table' | 'stat' | 'stats' | 'list' | 'detail';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type,
  variant,
  count = 3,
  className = ''
}) => {
  const activeType = variant || type || 'card';
  const items = Array.from({ length: count });

  if (activeType === 'stat' || activeType === 'stats') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3.5 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 animate-pulse space-y-2.5 shadow-sm"
          >
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-28 h-7 bg-slate-300 dark:bg-slate-750 rounded"></div>
            <div className="w-16 h-2.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activeType === 'table') {
    return (
      <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 animate-pulse space-y-3 shadow-sm ${className}`}>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-4"></div>
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-200 dark:border-slate-800/60 last:border-0">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-3.5 bg-slate-300 dark:bg-slate-750 rounded"></div>
              <div className="w-1/4 h-2.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="w-20 h-6 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
            <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activeType === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 animate-pulse flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
              <div className="space-y-1.5 flex-1">
                <div className="w-1/2 h-3.5 bg-slate-300 dark:bg-slate-750 rounded"></div>
                <div className="w-1/3 h-2.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activeType === 'detail') {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="h-16 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/60"></div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-3"></div>
          <div className="h-32 bg-slate-100 dark:bg-slate-950 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Default 'card'
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 animate-pulse space-y-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="w-full h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="space-y-1.5 pt-1">
            <div className="w-3/4 h-4 bg-slate-300 dark:bg-slate-750 rounded"></div>
            <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/60">
            <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-24 h-8 bg-slate-300 dark:bg-slate-750 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
