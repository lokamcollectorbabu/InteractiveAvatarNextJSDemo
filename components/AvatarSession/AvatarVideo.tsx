import React, { forwardRef } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";

export const AvatarVideo = forwardRef<HTMLVideoElement>(({}, ref) => {
  const { sessionState } = useStreamingAvatarSession();
  const { connectionQuality } = useConnectionQuality();

  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

  return (
    <>
      {connectionQuality !== ConnectionQuality.UNKNOWN && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white rounded-lg px-4 py-2 border border-white/10 z-10">
          Connection: {connectionQuality}
        </div>
      )}

      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      >
        <track kind="captions" />
      </video>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-xl">Connecting...</div>
        </div>
      )}
    </>
  );
});

AvatarVideo.displayName = "AvatarVideo";