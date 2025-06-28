'use client';

import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorLogViewer } from "@/components/ErrorLogViewer";
import { errorLogger } from "@/lib/errorLogger";
import { useEffect } from "react";

// Dynamic import with no SSR to avoid workStore issues
const InteractiveAvatar = dynamic(
  () => import("@/components/InteractiveAvatar").catch((error) => {
    errorLogger.log(error, {
      component: 'InteractiveAvatar Dynamic Import',
      props: { dynamicImport: true }
    });
    throw error;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    ),
  },
);

export default function App() {
  useEffect(() => {
    // Log page load
    errorLogger.log('Page loaded successfully', {
      component: 'App',
      url: window.location.href
    });
  }, []);

  return (
    <ErrorBoundary>
      <InteractiveAvatar />
      {process.env.NODE_ENV === 'development' && <ErrorLogViewer />}
    </ErrorBoundary>
  );
}