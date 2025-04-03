"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
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
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const completionTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNavigationRef = useRef<string>('');
  
  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (completionTimeout.current) {
      clearTimeout(completionTimeout.current);
      completionTimeout.current = null;
    }
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    clearAllTimers();
    
    setIsNavigating(true);
    setProgress(10); // Start at a lower percentage for a more visible progression
    
    // Use a logarithmic growth pattern for smoother progression
    // Start with small increments and gradually increase
    let increment = 2;
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        // Gradually slow down as we approach 85%
        if (prev >= 75) {
          increment = 0.5;
        } else if (prev >= 50) {
          increment = 1;
        } else if (prev >= 30) {
          increment = 1.5;
        }
        
        if (prev >= 85) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          return 85;
        }
        return prev + increment;
      });
    }, 200); // Longer interval for slower updates
    
    // Longer safety timeout for the slower progression
    navigationTimeoutRef.current = setTimeout(() => {
      completeNavigation();
    }, 6000);
  }, [clearAllTimers]);

  const completeNavigation = useCallback(() => {
    clearAllTimers();
    
    // Smooth transition to 100%
    setProgress(90);
    setTimeout(() => {
      setProgress(100);
    }, 100);
    
    completionTimeout.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 500); // Longer completion animation for smoother fade-out
  }, [clearAllTimers]);

  // Handle navigation events with debouncing
  useEffect(() => {
    // Skip initial render navigation
    if (!lastNavigationRef.current) {
      lastNavigationRef.current = `${pathname}?${searchParams?.toString() || ''}`;
      return;
    }
    
    const url = `${pathname}?${searchParams?.toString() || ''}`;
    
    // Skip navigation progress for same URL
    if (url === lastNavigationRef.current) {
      return;
    }
    
    // Different URL - update ref first
    lastNavigationRef.current = url;
    
    startNavigation();
    
    // Complete the navigation after a longer delay for smoother appearance
    setTimeout(() => {
      completeNavigation();
    }, 1200);
    
  }, [pathname, searchParams, startNavigation, completeNavigation]);
  
  // Clean up on unmount
  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

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
        <div className="fixed top-0 left-0 w-full h-0.5 bg-zinc-200 dark:bg-zinc-700 z-[9999]">
          <div
            className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </NavigationProgressContext.Provider>
  );
};

export default NavigationProgressProvider; 