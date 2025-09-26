"use client";

import { OverlayContainer } from "@/components/overlay-container";
import { AnalyticsTab } from "@/components/tabs/analytics-tab";

interface AnalyticsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsOverlay({
  isOpen,
  onClose,
}: AnalyticsOverlayProps) {
  return (
    <OverlayContainer
      isOpen={isOpen}
      onClose={onClose}
      title="Analytics"
    >
      <AnalyticsTab />
    </OverlayContainer>
  );
}
