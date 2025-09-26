"use client";

import { OverlayContainer } from "@/components/overlay-container";
import { SettingsTab } from "@/components/tabs/settings-tab";

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTerrainToggle?: (enabled: boolean, exaggeration?: number) => void;
}

export function SettingsOverlay({
  isOpen,
  onClose,
  onTerrainToggle,
}: SettingsOverlayProps) {
  return (
    <OverlayContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
    >
      <SettingsTab onTerrainToggle={onTerrainToggle} />
    </OverlayContainer>
  );
}
