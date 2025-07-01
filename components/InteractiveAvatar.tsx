"use client";

import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";
import dynamic from "next/dynamic";

import { Button } from "./Button";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";
import { QualitySelector } from "./AvatarSession/QualitySelector";

// Dynamically import WavyBackground to avoid SSR issues
const WavyBackground = dynamic(() => import("./ui/wavy-background").then(mod => mod.WavyBackground), {
  ssr: false,
});

const HARDCODED_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.Medium,
  avatarName: "Graham_Chair_Sitting_public",
  knowledgeId: "55764ebc76ac4ff684e2f9c94c7ba1a3",
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

const HARDCODED_API_KEY =
  "ZjVjNDYzODRlYTliNDRkMjk5ZWQyYjc0Y2Y5NDU2MGMtMTc1MDkxNjc5Mg==";

function InteractiveAvatar() {
  const {
    initAvatar,
    startAvatar,
    stopAvatar,
    sessionState,
    stream,
    interruptAvatar,
  } = useStreamingAvatarSession();
  const { startVoiceChat, stopVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(HARDCODED_CONFIG);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isManualStop, setIsManualStop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<any>(null);

  // Request microphone permissions early
  const requestMicrophonePermission = useMemoizedFn(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      return false;
    }
  });

  const startSessionV2 = useMemoizedFn(async () => {
    try {
      setIsRetrying(false);
      setIsManualStop(false);
      setError(null);

      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();

      if (!hasPermission) {
        setError("Microphone permission is required for voice interaction. Please allow microphone access and try again.");
        return;
      }

      const avatar = initAvatar(HARDCODED_API_KEY);
      avatarRef.current = avatar;

      // Enhanced error handling for WebRTC issues
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        if (!isManualStop) {
          handleConnectionError();
        }
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        setRetryCount(0);
        setError(null);
      });

      // Voice chat event handlers
      avatar.on(StreamingEvents.USER_START, (event) => {
        // User started talking
      });

      avatar.on(StreamingEvents.USER_STOP, (event) => {
        // User stopped talking
      });

      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        // User end message
      });

      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        // User talking message
      });

      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        // Avatar talking message
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        // Avatar end message
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        // Avatar started talking
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        // Avatar stopped talking
      });

      // Add error event handler for WebRTC issues
      avatar.on("error", (error) => {
        if (
          isManualStop &&
          error?.error?.errorDetail === "sctp-failure" &&
          error?.error?.sctpCauseCode === 12
        ) {
          return;
        }

        if (!isManualStop) {
          handleConnectionError();
        }
      });

      await startAvatar(config);
    } catch (error) {
      if (!isManualStop) {
        handleConnectionError();
      }
    }
  });

  const handleConnectionError = useMemoizedFn(async () => {
    if (isManualStop) {
      return;
    }

    if (retryCount < 3 && !isRetrying) {
      setIsRetrying(true);
      setRetryCount((prev) => prev + 1);

      try {
        await stopAvatar();
        stopVoiceChat();
      } catch (error) {
        // Ignore errors during cleanup
      }

      setTimeout(() => {
        if (!isManualStop) {
          startSessionV2();
        }
      }, 2000);
    } else {
      setIsRetrying(false);
      if (!isManualStop) {
        setError("Connection failed. Please check your internet connection and try again.");
      }
    }
  });

  const handleInterrupt = useMemoizedFn(async () => {
    try {
      if (
        avatarRef.current &&
        sessionState === StreamingAvatarSessionState.CONNECTED
      ) {
        await interruptAvatar();
      }
    } catch (error) {
      // Ignore interrupt errors
    }
  });

  const handleStopSession = useMemoizedFn(async () => {
    try {
      setIsManualStop(true);
      setIsRetrying(false);
      setRetryCount(0);
      setError(null);

      stopVoiceChat();
      await stopAvatar();
      avatarRef.current = null;
    } catch (error) {
      setIsManualStop(true);
      avatarRef.current = null;
    }
  });

  // Start voice chat only when the session is fully connected
  useEffect(() => {
    if (
      sessionState === StreamingAvatarSessionState.CONNECTED &&
      !isRetrying &&
      !isManualStop
    ) {
      setTimeout(() => {
        startVoiceChat();
      }, 2000);
    }
  }, [sessionState, startVoiceChat, isRetrying, isManualStop]);

  useUnmount(() => {
    setIsManualStop(true);
    handleStopSession();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  const handleQualityChange = (quality: AvatarQuality) => {
    setConfig((prev) => ({ ...prev, quality }));
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {sessionState === StreamingAvatarSessionState.INACTIVE ? (
        // Pre-session: Beautiful wavy background with start button
        <WavyBackground
          backgroundFill="black"
          blur={10}
          className="max-w-4xl mx-auto pb-40"
          colors={["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]}
          speed="fast"
          waveOpacity={0.5}
          waveWidth={50}
        >
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Conversation 2.0
              </h1>
              <p className="text-lg md:text-xl mt-4 text-white/80 font-normal text-center max-w-2xl mx-auto leading-relaxed">
                Leverage the power of Interactive avatars in every business and
                create beautiful conversations
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-8">
              <Button
                className="!px-12 !py-4 !text-lg !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !rounded-xl !shadow-2xl !transform !transition-all !duration-300 hover:!scale-105 !border-0 !font-semibold !tracking-wide"
                disabled={isRetrying}
                onClick={startSessionV2}
              >
                {isRetrying ? (
                  <div className="flex items-center gap-3">
                    <LoadingIcon className="animate-spin" size={20} />
                    Retrying... ({retryCount}/3)
                  </div>
                ) : (
                  "Start Session"
                )}
              </Button>
              {isRetrying && (
                <p className="text-white/60 mt-4 text-sm">
                  Reconnecting to avatar service...
                </p>
              )}
            </div>
          </div>
        </WavyBackground>
      ) : (
        // During session: Full interface
        <>
          {/* Main video container */}
          <div className="absolute inset-0">
            <AvatarVideo ref={mediaStream} />
          </div>

          {/* Semi-transparent overlay for controls */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-left: Quality selector */}
            <div className="absolute top-6 left-6 pointer-events-auto">
              <QualitySelector
                currentQuality={config.quality!}
                onQualityChange={handleQualityChange}
              />
            </div>

            {/* Top-right: Stop button and Interrupt button */}
            <div className="absolute top-6 right-6 flex gap-3 pointer-events-auto">
              {sessionState === StreamingAvatarSessionState.CONNECTED && (
                <Button
                  className="!bg-red-600/80 hover:!bg-red-700/80 !text-white !px-4 !py-2 !rounded-lg !backdrop-blur-sm !border !border-red-500/30"
                  onClick={handleInterrupt}
                >
                  Interrupt
                </Button>
              )}
              <Button
                className="!bg-zinc-800/80 hover:!bg-zinc-700/80 !text-white !px-4 !py-2 !rounded-lg !backdrop-blur-sm !border !border-zinc-600/30"
                onClick={handleStopSession}
              >
                Stop Session
              </Button>
            </div>

            {/* Bottom-center: Microphone controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              {sessionState === StreamingAvatarSessionState.CONNECTED ? (
                <AvatarControls />
              ) : sessionState === StreamingAvatarSessionState.CONNECTING ? (
                <div className="flex items-center justify-center">
                  <LoadingIcon className="animate-spin text-white" size={48} />
                  <span className="text-white ml-3">
                    {isRetrying ? "Reconnecting..." : "Connecting..."}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Left side: Conversation transcript */}
          {sessionState === StreamingAvatarSessionState.CONNECTED && (
            <div className="absolute left-6 top-20 bottom-20 w-80 pointer-events-auto">
              <div className="h-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-white font-medium">Conversation</h3>
                </div>
                <div className="h-full overflow-hidden">
                  <MessageHistory />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}