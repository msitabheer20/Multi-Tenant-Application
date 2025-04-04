"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const NavigationProgressContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startProgress = () => {
      setIsNavigating(true);
      setProgress(0);
      
      let simulatedProgress = 0;
      const interval = setInterval(() => {
        simulatedProgress += Math.random() * 15;
        if (simulatedProgress > 90) {
          clearInterval(interval);
          simulatedProgress = 90;
        }
        setProgress(simulatedProgress);
      }, 200);

      return interval;
    };

    const completeProgress = (interval: NodeJS.Timeout) => {
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 400);
    };

    const interval = startProgress();
    
    const timeout = setTimeout(() => {
      completeProgress(interval);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-700 z-[9999]">
      <div 
        className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const NavigationProgress = () => {
  return (
    <Suspense fallback={null}>
      <NavigationProgressContent />
    </Suspense>
  );
};

export default NavigationProgress; 