import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";
import { useInterrupt } from "../logic/useInterrupt";

import { AudioInput } from "./AudioInput";

export const AvatarControls: React.FC = () => {
  const { isVoiceChatLoading } = useVoiceChat();

  return (
    <div className="flex flex-col gap-3 relative items-center">
      {/* Large circular microphone button */}
      <div className="relative">
        <AudioInput />
      </div>
    </div>
  );
};