import React from "react";
import { AvatarQuality } from "@heygen/streaming-avatar";

import { Select } from "../Select";

interface QualitySelectorProps {
  currentQuality: AvatarQuality;
  onQualityChange: (quality: AvatarQuality) => void;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  currentQuality,
  onQualityChange,
}) => {
  const qualityOptions = Object.values(AvatarQuality);

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 p-2">
      <Select
        isSelected={(option) => option === currentQuality}
        options={qualityOptions}
        renderOption={(option) =>
          option.charAt(0).toUpperCase() + option.slice(1)
        }
        value={currentQuality.charAt(0).toUpperCase() + currentQuality.slice(1)}
        onSelect={onQualityChange}
      />
    </div>
  );
};