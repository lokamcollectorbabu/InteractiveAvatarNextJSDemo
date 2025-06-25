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

import { Button } from "./Button";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";
import { QualitySelector } from "./AvatarSession/QualitySelector";

const HARDCODED_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.Medium,
  avatarName: "Graham_Chair_Sitting_public",
  knowledgeId: "389e0c9a964c412480c1751cc30f1c3a",
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

const HARDCODED_API_KEY = "ZTE4MjRmMjg5NGRjNDMxNjg3MzFlZjFjNTBjYTBiYjctMTc0OTIyNzIwMg==";

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream, interruptAvatar } =
    useStreamingAvatarSession();
  const { startVoiceChat, stopVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(HARDCODED_CONFIG);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const mediaStream = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<any>(null);

  // Request microphone permissions early
  const requestMicrophonePermission = useMemoizedFn(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Close the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      return false;
    }
  });

  const startSessionV2 = useMemoizedFn(async () => {
    try {
      setIsRetrying(false);
      
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert("Microphone permission is required for voice interaction. Please allow microphone access and try again.");
        return;
      }

      const avatar = initAvatar(HARDCODED_API_KEY);
      avatarRef.current = avatar;

      // Enhanced error handling for WebRTC issues
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected - attempting reconnection");
        handleConnectionError();
      });

      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
        setRetryCount(0); // Reset retry count on successful connection
      });

      // Voice chat event handlers
      avatar.on(StreamingEvents.USER_START, (event) => {
        console.log(">>>>> User started talking:", event);
      });

      avatar.on(StreamingEvents.USER_STOP, (event) => {
        console.log(">>>>> User stopped talking:", event);
      });

      avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
        console.log(">>>>> User end message:", event);
      });

      avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
        console.log(">>>>> User talking message:", event);
      });

      avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
        console.log(">>>>> Avatar talking message:", event);
      });

      avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
        console.log(">>>>> Avatar end message:", event);
      });

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });

      // Add error event handler for WebRTC issues
      avatar.on('error', (error) => {
        console.error("Avatar error:", error);
        handleConnectionError();
      });

      await startAvatar(config);
    } catch (error) {
      console.error("Error starting avatar session:", error);
      handleConnectionError();
    }
  });

  const handleConnectionError = useMemoizedFn(async () => {
    if (retryCount < 3 && !isRetrying) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      console.log(`Attempting reconnection (${retryCount + 1}/3)...`);
      
      // Stop current session
      try {
        await stopAvatar();
        stopVoiceChat();
      } catch (error) {
        console.error("Error stopping avatar during retry:", error);
      }
      
      // Wait a bit before retrying
      setTimeout(() => {
        startSessionV2();
      }, 2000);
    } else {
      setIsRetrying(false);
      alert("Connection failed. Please check your internet connection and try again.");
    }
  });

  const handleInterrupt = useMemoizedFn(async () => {
    try {
      if (avatarRef.current && sessionState === StreamingAvatarSessionState.CONNECTED) {
        await interruptAvatar();
        console.log("Avatar interrupted successfully");
      }
    } catch (error) {
      console.error("Error interrupting avatar:", error);
    }
  });

  const handleStopSession = useMemoizedFn(async () => {
    try {
      stopVoiceChat();
      await stopAvatar();
      avatarRef.current = null;
      setRetryCount(0);
      setIsRetrying(false);
    } catch (error) {
      console.error("Error stopping session:", error);
    }
  });

  // Start voice chat only when the session is fully connected
  useEffect(() => {
    if (sessionState === StreamingAvatarSessionState.CONNECTED && !isRetrying) {
      // Add a small delay to ensure the connection is stable
      setTimeout(() => {
        startVoiceChat();
      }, 1000);
    }
  }, [sessionState, startVoiceChat, isRetrying]);

  useUnmount(() => {
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
    setConfig(prev => ({ ...prev, quality }));
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {sessionState === StreamingAvatarSessionState.INACTIVE ? (
        // Pre-session: Only show start button
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Button 
              className="!px-12 !py-4 !text-lg !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !rounded-xl !shadow-2xl !transform !transition-all !duration-200 hover:!scale-105"
              onClick={startSessionV2}
              disabled={isRetrying}
            >
              {isRetrying ? `Retrying... (${retryCount}/3)` : "Start Session"}
            </Button>
            {isRetrying && (
              <p className="text-white/70 mt-4">
                Reconnecting to avatar service...
              </p>
            )}
          </div>
        </div>
      ) : (
        // During session: Full interface
        <>
          {/* Main video container */}
          <div className="absolute inset-0">
            {sessionState !== StreamingAvatarSessionState.INACTIVE && (
              <AvatarVideo ref={mediaStream} />
            )}
          </div>

          {/* Semi-transparent overlay for controls */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top-left: Quality selector */}
            <div className="absolute top-6 left-6 pointer-events-auto">
              <QualitySelector 
                currentQuality={config.quality}
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