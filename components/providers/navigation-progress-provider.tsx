"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationProgressContextType {
  isNavigating: boolean;
  progress: number;
  startNavigation: () => void;
  completeNavigation: () => void;
}

const NavigationProgressContext = createContext<NavigationProgressContextType>({
  isNavigating: false,
  progress: 0,
  startNavigation: () => {},
  completeNavigation: () => {},
});

export const useNavigationProgress = () => useContext(NavigationProgressContext);

export const NavigationProgressProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  const startNavigation = () => {
    if (progressInterval) clearInterval(progressInterval);
    
    setIsNavigating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (progressInterval) clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
    
    setProgressInterval(interval);
  };

  const completeNavigation = () => {
    if (progressInterval) clearInterval(progressInterval);
    
    setProgress(100);
    
    setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 400);
  };

  // Track route changes
  useEffect(() => {
    startNavigation();
    
    // Simulate route change completion
    const timeout = setTimeout(() => {
      completeNavigation();
    }, 800);
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return (
    <NavigationProgressContext.Provider
      value={{
        isNavigating,
        progress,
        startNavigation,
        completeNavigation,
      }}
    >
      {children}
      {isNavigating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-700 z-[9999]">
          <div
            className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </NavigationProgressContext.Provider>
  );
};

export default NavigationProgressProvider; 