"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

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
  const router = useRouter();
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
    // Generate a key for this navigation attempt
    const currentNavigation = `${pathname}?${searchParams?.toString() || ''}`;
    
    // If navigating to the same URL, don't show progress
    if (currentNavigation === lastNavigationRef.current) {
      return;
    }
    
    // Save this navigation attempt
    lastNavigationRef.current = currentNavigation;
    
    // Clear existing timers
    clearAllTimers();
    
    setIsNavigating(true);
    setProgress(15); // Start with a larger initial progress for immediate feedback
    
    // Use smoother progression
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
          return 85;
        }
        return prev + (85 - prev) * 0.05; // Slower, more gradual increase
      });
    }, 80);
    
    // Safety timeout - if navigation doesn't complete within 5 seconds, force complete
    navigationTimeoutRef.current = setTimeout(() => {
      completeNavigation();
    }, 5000);
  }, [pathname, searchParams, clearAllTimers]);

  const completeNavigation = useCallback(() => {
    clearAllTimers();
    
    setProgress(100);
    
    completionTimeout.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 400);
  }, [clearAllTimers]);

  // Handle navigation events
  useEffect(() => {
    const url = `${pathname}?${searchParams?.toString() || ''}`;
    
    // Skip navigation progress for same URL
    if (url === lastNavigationRef.current && lastNavigationRef.current !== '') {
      return;
    }
    
    // First load - just store the URL without showing progress
    if (lastNavigationRef.current === '') {
      lastNavigationRef.current = url;
      return;
    }
    
    // Different URL - show navigation progress
    startNavigation();
    
    // Complete the navigation after a delay
    setTimeout(() => {
      completeNavigation();
    }, 800);
    
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
            className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-200 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </NavigationProgressContext.Provider>
  );
};

export default NavigationProgressProvider; 