'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Network, ChevronUp, ChevronDown } from 'lucide-react';
import { ActionsSidePanel } from './actions-side-panel';
import { DisasterControlPane } from './disaster-control/disaster-control-pane';
import type { PolygonData } from './polygon-editor';

interface BottomPaneProps {
  isOpen: boolean;
  onClose: () => void;
  context: PolygonData | any; // Can be polygon data or crisis event
  sidebarWidth?: number; // Width of the sidebar to offset the pane
}

type TabType = 'actions' | 'workflow';

export function BottomPane({ isOpen, onClose, context, sidebarWidth = 60 }: BottomPaneProps) {
  const [activeTab, setActiveTab] = useState<TabType>('actions');
  const [isExpanded, setIsExpanded] = useState(false);

  const paneHeight = isExpanded ? 'calc(100vh - 80px)' : '60vh';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-zinc-800 shadow-2xl"
          style={{ 
            height: paneHeight,
            left: `${sidebarWidth}px`,
            width: `calc(100% - ${sidebarWidth}px)`
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-black/40">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'actions'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Emergency Actions
              </button>
              <button
                onClick={() => setActiveTab('workflow')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'workflow'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Network className="w-4 h-4" />
                Workflow Editor
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-49px)] overflow-hidden">
            {activeTab === 'actions' && (
              <div className="h-full">
                <ActionsSidePanel
                  isOpen={true}
                  onClose={onClose}
                  polygon={context}
                  embedded={true}
                />
              </div>
            )}
            {activeTab === 'workflow' && (
              <div className="h-full">
                <DisasterControlPane />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
