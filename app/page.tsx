'use client';

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Dynamic import with no SSR to avoid workStore issues
const InteractiveAvatar = dynamic(
  () => import("@/components/InteractiveAvatar"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    ),
  },
);

// Explicitly define the page props interface to handle searchParams properly
interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function App({ searchParams }: PageProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <InteractiveAvatar />
    </ErrorBoundary>
  );
}