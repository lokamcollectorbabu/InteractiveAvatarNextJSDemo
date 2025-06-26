import React from "react";

import { AudioInput } from "./AudioInput";

export const AvatarControls: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 relative items-center">
      {/* Large circular microphone button */}
      <div className="relative">
        <AudioInput />
      </div>
    </div>
  );
};