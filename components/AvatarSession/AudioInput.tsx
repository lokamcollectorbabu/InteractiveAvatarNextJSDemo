import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";
import { Button } from "../Button";
import { LoadingIcon, MicIcon, MicOffIcon } from "../Icons";
import { useConversationState } from "../logic/useConversationState";

export const AudioInput: React.FC = () => {
  const { muteInputAudio, unmuteInputAudio, isMuted, isVoiceChatLoading } =
    useVoiceChat();
  const { isUserTalking } = useConversationState();

  const handleMuteClick = () => {
    if (isMuted) {
      unmuteInputAudio();
    } else {
      muteInputAudio();
    }
  };

  return (
    <div className="relative">
      <Button
        className={`!p-6 !rounded-full !w-20 !h-20 relative !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !shadow-2xl !transform !transition-all !duration-200 hover:!scale-105 ${
          isUserTalking ? '!shadow-blue-500/50 !shadow-2xl' : ''
        }`}
        disabled={isVoiceChatLoading}
        onClick={handleMuteClick}
      >
        {/* Animated ring for when user is talking */}
        <div
          className={`absolute inset-0 rounded-full border-4 border-blue-400 ${
            isUserTalking ? "animate-ping" : "opacity-0"
          }`}
        />
        
        {/* Icon */}
        {isVoiceChatLoading ? (
          <LoadingIcon className="animate-spin text-white" size={32} />
        ) : isMuted ? (
          <MicOffIcon className="text-white" size={32} />
        ) : (
          <MicIcon className="text-white" size={32} />
        )}
      </Button>
      
      {/* Status text */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <span className="text-white/70 text-sm">
          {isVoiceChatLoading ? "Connecting..." : isMuted ? "Tap to unmute" : "Listening..."}
        </span>
      </div>
    </div>
  );
};