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
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();

  const [config, setConfig] = useState<StartAvatarRequest>(HARDCODED_CONFIG);
  const mediaStream = useRef<HTMLVideoElement>(null);

  const startSessionV2 = useMemoizedFn(async () => {
    try {
      const avatar = initAvatar(HARDCODED_API_KEY);

      avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });
      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });
      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
      });
      avatar.on(StreamingEvents.STREAM_READY, (event) => {
        console.log(">>>>> Stream ready:", event.detail);
      });
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

      await startAvatar(config);
      await startVoiceChat();
    } catch (error) {
      console.error("Error starting avatar session:", error);
    }
  });

  useUnmount(() => {
    stopAvatar();
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
          <Button 
            className="!px-12 !py-4 !text-lg !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !rounded-xl !shadow-2xl !transform !transition-all !duration-200 hover:!scale-105"
            onClick={startSessionV2}
          >
            Start Session
          </Button>
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
                  onClick={stopAvatar}
                >
                  Interrupt
                </Button>
              )}
              <Button
                className="!bg-zinc-800/80 hover:!bg-zinc-700/80 !text-white !px-4 !py-2 !rounded-lg !backdrop-blur-sm !border !border-zinc-600/30"
                onClick={stopAvatar}
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