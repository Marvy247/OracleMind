'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  animated?: boolean;
}

export default function ProgressBar({ progress, label, color = 'var(--neon-blue)', animated = true }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayProgress(progress), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className="w-full">
      {label && <div className="text-sm font-medium mb-2">{label}</div>}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden glow">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out pulse-glow"
          style={{
            width: `${displayProgress}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40, 0 0 20px ${color}20, 0 0 30px ${color}10`,
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-1">{Math.round(displayProgress)}%</div>
    </div>
  );
}
