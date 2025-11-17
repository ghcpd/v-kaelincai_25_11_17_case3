'use client';

import React, { useState, useEffect, useRef } from 'react';
import { mockInstallationState } from './mockData';

type TabType = 'program' | 'messages' | 'queue';

interface Message {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

interface Program {
  id: string;
  name: string;
  available_now: boolean;
  status: string;
  options?: Array<{ id: string; label: string; votes: number }>;
}

export default function LiveInteractionPanelImproved() {
  const [state, setState] = useState<typeof mockInstallationState>(mockInstallationState);
  const [activeTab, setActiveTab] = useState<TabType>('program');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [retryError, setRetryError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const getCrowdednessColor = (crowdedness: string) => {
    switch (crowdedness) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getInstallationStatusBg = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-green-50 border-green-300';
      case 'CROWDED':
        return 'bg-yellow-50 border-yellow-300';
      case 'PAUSED':
        return 'bg-blue-50 border-blue-300';
      case 'MAINTENANCE':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  const isDisabled = state.installation_state !== 'NORMAL';

  const handleVote = async (programId: string, optionId: string) => {
    setSending(true);
    setError('');
    setRetryError(null);

    try {
      // Simulate network request
      const shouldFail = Math.random() < state.network_failure_rate;
      if (shouldFail) {
        throw new Error('Network error');
      }

      await new Promise(resolve => setTimeout(resolve, state.network_latency));

      setVotes(prev => ({
        ...prev,
        [optionId]: (prev[optionId] || 0) + 1
      }));

      setSuccess('Vote recorded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setRetryError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    setError('');
    setRetryError(null);

    try {
      const shouldFail = Math.random() < state.network_failure_rate;
      if (shouldFail) {
        throw new Error('Network error');
      }

      await new Promise(resolve => setTimeout(resolve, state.network_latency));

      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: Date.now(),
            author: 'You',
            text: message,
            timestamp: new Date().toISOString()
          }
        ]
      }));

      setMessage('');
      setSuccess('Message sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setRetryError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async () => {
    if (retryError) {
      if (message.trim()) {
        await handleSendMessage();
      } else {
        setRetryError(null);
      }
    }
  };

  const renderStatusArea = () => (
    <div className={`border-b-2 p-4 ${getInstallationStatusBg(state.installation_state)}`}>
      <div className="max-w-6xl mx-auto">
        {/* Installation Status */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Installation Status</h2>
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold">{state.installation_state}</span>
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              state.installation_state === 'NORMAL' ? 'bg-green-200 text-green-800' :
              state.installation_state === 'CROWDED' ? 'bg-yellow-200 text-yellow-800' :
              state.installation_state === 'PAUSED' ? 'bg-blue-200 text-blue-800' :
              'bg-red-200 text-red-800'
            }`}>
              {state.installation_state}
            </div>
          </div>
        </div>

        {/* Queue and Crowdedness Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600">Queue Length</p>
            <p className="text-2xl font-bold text-gray-800">{state.queue_length}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600">Crowdedness</p>
            <p className="text-sm font-semibold text-gray-800">{state.crowdedness}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600">Network</p>
            <p className="text-sm font-semibold text-gray-800">{state.network_latency}ms</p>
          </div>
        </div>

        {/* Warning for crowded state */}
        {state.crowdedness === 'HIGH' && (
          <div className="mt-3 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
            <p className="text-sm text-yellow-700">
              ⚠️ This installation is crowded. Expected wait time: ~15 minutes
            </p>
          </div>
        )}

        {/* State-specific messages */}
        {state.installation_state === 'PAUSED' && (
          <div className="mt-3 bg-blue-100 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-sm text-blue-700">
              ⏸️ System maintenance in progress. We'll be back online soon!
            </p>
          </div>
        )}

        {state.installation_state === 'MAINTENANCE' && (
          <div className="mt-3 bg-red-100 border-l-4 border-red-500 p-3 rounded">
            <p className="text-sm text-red-700">
              🔧 Scheduled maintenance. Expected completion: 18:00 UTC
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgramTab = () => (
    <div className="p-4 max-w-6xl mx-auto">
      {state.programs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-lg mb-2">No programs available right now</p>
          <p className="text-gray-500 text-sm mb-4">Next program starts in ~3.5 hours</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Explore Other Installations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {state.programs.map((program: Program) => (
            <div
              key={program.id}
              onClick={() => setSelectedProgram(selectedProgram === program.id ? null : program.id)}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                selectedProgram === program.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{program.name}</h3>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{program.status}</span>
                  </p>
                </div>
                <div className={`text-2xl ${selectedProgram === program.id ? '' : 'opacity-50'}`}>
                  {selectedProgram === program.id ? '▼' : '▶'}
                </div>
              </div>

              {selectedProgram === program.id && program.options && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Vote for your favorite:</p>
                  <div className="space-y-2">
                    {program.options.map(opt => (
                      <button
                        key={opt.id}
                        onClick={e => {
                          e.stopPropagation();
                          handleVote(program.id, opt.id);
                        }}
                        disabled={sending || isDisabled}
                        className={`w-full p-3 rounded-lg font-semibold transition flex justify-between items-center ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        aria-label={`Vote for ${opt.label}`}
                      >
                        <span>{opt.label}</span>
                        <span className="bg-blue-800 px-3 py-1 rounded-full text-sm">
                          {votes[opt.id] || opt.votes} votes
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="flex flex-col h-[calc(100vh-400px)]">
      {/* Messages feed */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {state.messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Be the first to share!</p>
          </div>
        ) : (
          state.messages.map(msg => (
            <div
              key={msg.id}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-gray-800 text-sm">{msg.author}</p>
                <p className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <p className="text-gray-700 text-sm">{msg.text}</p>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white space-y-2">
        {retryError && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="text-red-700 text-sm">⚠️ {retryError}</span>
            <button
              onClick={handleRetry}
              className="bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !sending && handleSendMessage()}
            disabled={sending || isDisabled}
            placeholder="Share your thoughts..."
            className={`flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Message input"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !message.trim() || isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              isDisabled || !message.trim()
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            aria-label="Send message"
          >
            {sending ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderQueueTab = () => (
    <div className="p-4 max-w-6xl mx-auto">
      {state.queue_length === 0 ? (
        <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 text-lg font-semibold">✓ Queue is empty</p>
          <p className="text-green-600 text-sm mt-2">You can interact immediately!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-semibold">Queue Position: #{Math.min(3, state.queue_length)}</p>
            <p className="text-yellow-700 text-sm mt-1">Estimated wait: ~5 minutes</p>
          </div>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`border rounded-lg p-4 ${
                i === 3
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">Position #{i}</p>
                  <p className="text-sm text-gray-600">
                    {i === 3 ? 'You are here' : `User ${i}`}
                  </p>
                </div>
                <p className="text-sm text-gray-600">5 min reserved</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Status Area - Top */}
      {renderStatusArea()}

      {/* Tab Navigation */}
      <div className="border-b border-gray-300 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex">
          {(['program', 'messages', 'queue'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 font-semibold transition-colors ${
                activeTab === tab
                  ? 'border-b-4 border-blue-600 text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              aria-selected={activeTab === tab}
              role="tab"
            >
              {tab === 'program' && '🎨 Program Interaction'}
              {tab === 'messages' && '💬 Live Wall'}
              {tab === 'queue' && '⏳ Reservation Queue'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'program' && renderProgramTab()}
        {activeTab === 'messages' && renderMessagesTab()}
        {activeTab === 'queue' && renderQueueTab()}
      </div>

      {/* Success Notification */}
      {success && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          ✓ {success}
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed bottom-4 left-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          ✕ {error}
        </div>
      )}
    </div>
  );
}
