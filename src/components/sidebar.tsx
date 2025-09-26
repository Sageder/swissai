"use client";

import { Button } from "@/components/ui/button";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Settings,
  BarChart3,
  Map,
  Bot,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { placeToThumbnail } from "@/lib/staticMaps";

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  activeView?: string;
  onViewChange?: (view: string) => void;
  onAIChatOpen?: () => void;
  onDebugPanelOpen?: () => void;
}

const places = [
  {
    id: "town-1",
    name: "Zürich Stadelhofen",
    lat: 47.36667969484764,
    lng: 8.548521957630859,
  },
  {
    id: "town-2",
    name: "Castrop-Rauxel",
    lat: 51.56672094619629,
    lng: 7.317773114685705,
  },
];

export function Sidebar({
  expanded,
  onToggle,
  activeView = "map",
  onViewChange,
  onAIChatOpen,
  onDebugPanelOpen,
}: SidebarProps) {
  const menuItems = [
    { id: "map", icon: Map, label: "Map View" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleAIChatClick = () => {
    if (onAIChatOpen) {
      onAIChatOpen();
    }
  };

  const handleDebugPanelClick = () => {
    if (onDebugPanelOpen) {
      onDebugPanelOpen();
    }
  };

  const handleMenuClick = (itemId: string) => {
    if (onViewChange) {
      onViewChange(itemId);
    }
  };

  return (
    <motion.div
      animate={{ width: expanded ? 320 : 60 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="absolute left-0 top-0 bottom-0 z-50 glass-sidebar"
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <h1 className="text-xl font-bold text-white tracking-tight">
                  SwissAI
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white/80 hover:text-white hover:bg-white/10 border-0"
          >
            <motion.div transition={{ duration: 0.3 }}>
              {expanded ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Town Previews Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-4 border-b border-white/10"
          >
            <div className="grid grid-cols-1 gap-4">
              {places.map((value, index) => (
                <motion.div
                  key={value.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="town-preview-card cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-black/20 border border-white/10">
                    <img
                      src={placeToThumbnail(value)}
                      alt={value.name}
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Blur gradient overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                      style={{
                        backdropFilter: "blur(1px)",
                        WebkitBackdropFilter: "blur(1px)",
                      }}
                    />
                    {/* Text overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="text-base font-medium text-white drop-shadow-lg font-[family-name:var(--font-instrument-serif)]">
                        {value.name}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-3"
            >
              <h3 className="text-xs font-medium text-white/60 px-2 mb-2 uppercase tracking-wider">
                Navigation
              </h3>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 border-0",
                  !expanded && "px-2",
                  activeView === item.id
                    ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/20 hover:text-blue-300"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
                onClick={() => handleMenuClick(item.id)}
              >
                <item.icon size={18} />
                <AnimatePresence mode="wait">
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* AI Chat Button */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 border-0 text-white/80 hover:text-white hover:bg-white/10",
              !expanded && "px-2"
            )}
            onClick={handleAIChatClick}
          >
            <Bot size={18} />
            <AnimatePresence mode="wait">
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  AI Assistant
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Debug Panel Button */}
        <div className="mt-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 border-0 text-white/80 hover:text-white hover:bg-white/10",
              !expanded && "px-2"
            )}
            onClick={handleDebugPanelClick}
          >
            <Activity size={18} />
            <AnimatePresence mode="wait">
              {expanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Debug Panel
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <AnimatePresence mode="wait">
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-white/50"
            >
              Dashboard v1.0
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
