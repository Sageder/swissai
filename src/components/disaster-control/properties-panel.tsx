'use client';

import React from 'react';
import { GraphNode, ToolDefinition, AVAILABLE_TOOLS } from '@/types/disaster-control';
import { Settings, Info, Trash2, Copy } from 'lucide-react';

interface PropertiesPanelProps {
  selectedNode?: GraphNode;
  onNodeUpdate: (nodeId: string, updates: Partial<GraphNode>) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeDuplicate: (nodeId: string) => void;
}

export function PropertiesPanel({
  selectedNode,
  onNodeUpdate,
  onNodeDelete,
  onNodeDuplicate,
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-600">
        <div className="text-center">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Select a node</p>
        </div>
      </div>
    );
  }

  const updateNodeData = (key: string, value: any) => {
    onNodeUpdate(selectedNode.id, {
      data: { ...selectedNode.data, [key]: value },
    });
  };

  const updateNodeLabel = (label: string) => {
    onNodeUpdate(selectedNode.id, { label });
  };

  const updateNodeDescription = (description: string) => {
    onNodeUpdate(selectedNode.id, { description });
  };

  const renderNodeSpecificFields = () => {
    const inputClass = "w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-700 resize-none";
    const labelClass = "block text-[10px] font-medium text-zinc-500 mb-1";
    
    switch (selectedNode.type) {
      case 'start':
        return (
          <div className="space-y-2">
            <div>
              <label className={labelClass}>
                Initial Context
              </label>
              <textarea
                value={selectedNode.data.initialContext || ''}
                onChange={(e) => updateNodeData('initialContext', e.target.value)}
                className={inputClass}
                rows={3}
                placeholder="Describe the initial context..."
              />
            </div>
          </div>
        );

      case 'if':
        return (
          <div className="space-y-3">
            <div className="p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-200">
              <strong>Mode Selection:</strong><br/>
              • <strong>AI Mode:</strong> Fill "Evaluation Prompt" below<br/>
              • <strong>Text Mode:</strong> Fill "Condition" only<br/>
              • <strong>Auto Mode:</strong> Leave both empty
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Evaluation Prompt (AI Mode) 🤖
              </label>
              <textarea
                value={selectedNode.data.evaluationPrompt || ''}
                onChange={(e) => updateNodeData('evaluationPrompt', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-yellow-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={3}
                placeholder='e.g., "true if the user glazes LeBron James"'
              />
              <p className="text-xs text-gray-500 mt-1">AI analyzes sentiment and meaning</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Condition (Text/Variable Mode) 📝
              </label>
              <textarea
                value={selectedNode.data.condition || ''}
                onChange={(e) => updateNodeData('condition', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder='e.g., "contains fire" or "${variable}"'
              />
              <p className="text-xs text-gray-500 mt-1">Simple text matching or variable check</p>
            </div>
          </div>
        );

      case 'user-interaction':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Prompt
              </label>
              <textarea
                value={selectedNode.data.prompt || ''}
                onChange={(e) => updateNodeData('prompt', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Message to show the user..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Response Type
              </label>
              <select
                value={selectedNode.data.expectedResponseType || 'text'}
                onChange={(e) => updateNodeData('expectedResponseType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Text</option>
                <option value="confirmation">Confirmation</option>
                <option value="choice">Choice</option>
                <option value="data">Data</option>
              </select>
            </div>
            {selectedNode.data.expectedResponseType === 'choice' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Choices (comma-separated)
                </label>
                <input
                  type="text"
                  value={selectedNode.data.choices?.join(', ') || ''}
                  onChange={(e) => updateNodeData('choices', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Save Response As (Variable Name)
              </label>
              <input
                type="text"
                value={selectedNode.data.saveResponseAs || ''}
                onChange={(e) => updateNodeData('saveResponseAs', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="userResponse"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={selectedNode.data.timeout || 300}
                onChange={(e) => updateNodeData('timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        );

      case 'tool-call':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Tool
              </label>
              <select
                value={selectedNode.data.toolName || ''}
                onChange={(e) => {
                  const tool = AVAILABLE_TOOLS.find(t => t.name === e.target.value);
                  updateNodeData('toolName', e.target.value);
                  if (tool) {
                    updateNodeData('toolDescription', tool.description);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a tool...</option>
                {AVAILABLE_TOOLS.map((tool) => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedNode.data.toolName && (
              <>
                <div className="p-2 bg-gray-800/50 rounded border border-gray-700 text-xs text-gray-400">
                  {AVAILABLE_TOOLS.find(t => t.name === selectedNode.data.toolName)?.description}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Parameters (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(selectedNode.data.parameters || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const params = JSON.parse(e.target.value);
                        updateNodeData('parameters', params);
                      } catch (err) {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-xs text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={6}
                    placeholder='{\n  "param1": "value1"\n}'
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Save Result As (Variable Name)
              </label>
              <input
                type="text"
                value={selectedNode.data.saveResultAs || ''}
                onChange={(e) => updateNodeData('saveResultAs', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="toolResult"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="retryOnFailure"
                checked={selectedNode.data.retryOnFailure || false}
                onChange={(e) => updateNodeData('retryOnFailure', e.target.checked)}
                className="w-4 h-4 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <label htmlFor="retryOnFailure" className="text-xs text-gray-400">
                Retry on failure
              </label>
            </div>
          </div>
        );

      case 'data-query':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Query Type
              </label>
              <select
                value={selectedNode.data.queryType || 'firebase'}
                onChange={(e) => updateNodeData('queryType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="firebase">Firebase</option>
                <option value="knowledge-base">Knowledge Base</option>
                <option value="simulation">Simulation Data</option>
              </select>
            </div>
            {selectedNode.data.queryType === 'firebase' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Collection
                </label>
                <input
                  type="text"
                  value={selectedNode.data.collection || ''}
                  onChange={(e) => updateNodeData('collection', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="evacuees"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Query
              </label>
              <textarea
                value={selectedNode.data.query || ''}
                onChange={(e) => updateNodeData('query', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows={3}
                placeholder="Describe what data to query..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Save Result As (Variable Name)
              </label>
              <input
                type="text"
                value={selectedNode.data.saveResultAs || ''}
                onChange={(e) => updateNodeData('saveResultAs', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="queryResult"
              />
            </div>
          </div>
        );

      case 'decision':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Decision Prompt
              </label>
              <textarea
                value={selectedNode.data.decisionPrompt || ''}
                onChange={(e) => updateNodeData('decisionPrompt', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
                placeholder="What decision should the AI make?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Options (comma-separated)
              </label>
              <input
                type="text"
                value={selectedNode.data.options?.join(', ') || ''}
                onChange={(e) => updateNodeData('options', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Option A, Option B, Option C"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Save Decision As (Variable Name)
              </label>
              <input
                type="text"
                value={selectedNode.data.saveDecisionAs || ''}
                onChange={(e) => updateNodeData('saveDecisionAs', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="aiDecision"
              />
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Summary
              </label>
              <textarea
                value={selectedNode.data.summary || ''}
                onChange={(e) => updateNodeData('summary', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Workflow completion summary..."
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-xs text-gray-500">
            No specific properties for this node type.
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-medium">Properties</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNodeDuplicate(selectedNode.id)}
            className="p-1 hover:bg-zinc-900 rounded transition-colors"
            title="Duplicate Node"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          <button
            onClick={() => onNodeDelete(selectedNode.id)}
            className="p-1 hover:bg-zinc-900 rounded transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Node Type Badge */}
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px]">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="capitalize text-zinc-400">{selectedNode.type.replace('-', ' ')}</span>
        </div>

        {/* Basic Properties */}
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-medium text-zinc-500 mb-1">
              Label
            </label>
            <input
              type="text"
              value={selectedNode.label}
              onChange={(e) => updateNodeLabel(e.target.value)}
              className="w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-700"
              placeholder="Node label"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-zinc-500 mb-1">
              Description
            </label>
            <textarea
              value={selectedNode.description || ''}
              onChange={(e) => updateNodeDescription(e.target.value)}
              className="w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
              rows={2}
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Node-specific fields */}
        <div className="pt-2 border-t border-zinc-800">
          <h4 className="text-[10px] font-medium text-zinc-500 mb-2 uppercase tracking-wider">
            Configuration
          </h4>
          {renderNodeSpecificFields()}
        </div>

        {/* Node Info */}
        <div className="pt-2 border-t border-zinc-800">
          <div className="flex items-start gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded">
            <Info className="w-3 h-3 text-zinc-600 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-zinc-600">
              <p className="font-medium text-zinc-500 mb-0.5">ID: {selectedNode.id}</p>
              <p>Pos: ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})</p>
              <p>Status: <span className="capitalize">{selectedNode.status}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
