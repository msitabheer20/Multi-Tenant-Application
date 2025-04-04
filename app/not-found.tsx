"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-bold">404</h1>
        <h2 className="text-xl md:text-2xl">Page Not Found</h2>
        <p className="text-muted-foreground">
          We couldn't find the page you're looking for.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          Go back home
        </Link>
      </Button>
    </div>
  );
} 