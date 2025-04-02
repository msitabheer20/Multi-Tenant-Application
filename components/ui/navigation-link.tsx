"use client";

import Link from "next/link";
import { useNavigationProgress } from "@/components/providers/navigation-progress-provider";
import { ReactNode } from "react";

interface NavigationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const NavigationLink = ({ 
  href, 
  children, 
  className = "", 
  onClick
}: NavigationLinkProps) => {
  const { startNavigation } = useNavigationProgress();
  
  const handleClick = () => {
    startNavigation();
    if (onClick) onClick();
  };
  
  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}; 