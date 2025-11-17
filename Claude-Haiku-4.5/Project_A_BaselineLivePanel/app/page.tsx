'use client';

import React, { useState, useEffect } from 'react';
import { mockInstallationState } from './mockData';

export default function LiveInteractionPanelBaseline() {
  const [state, setState] = useState(mockInstallationState);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [votes, setVotes] = useState({});

  const handleVote = async (programId, optionId) => {
    setSending(true);
    try {
      // Simulate network request with failure rate
      if (Math.random() < state.network_failure_rate) {
        throw new Error('Network error');
      }
      await new Promise(resolve => setTimeout(resolve, state.network_latency));
      
      setVotes(prev => ({
        ...prev,
        [optionId]: (prev[optionId] || 0) + 1
      }));
      setError('');
    } catch (err) {
      setError('Vote failed. Retry?');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      if (Math.random() < state.network_failure_rate) {
        throw new Error('Network error');
      }
      await new Promise(resolve => setTimeout(resolve, state.network_latency));
      
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: Date.now(), author: 'You', text: message, timestamp: new Date().toISOString() }
        ]
      }));
      setMessage('');
      setError('');
    } catch (err) {
      setError('Message failed. Retry?');
    } finally {
      setSending(false);
    }
  };

  const isDisabled = state.installation_state !== 'NORMAL';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Minimal Header */}
      <div style={{ padding: '10px', backgroundColor: '#333', color: '#fff', fontSize: '12px' }}>
        <p>Status: {state.installation_state} | Queue: {state.queue_length} | Network: {state.network_latency}ms</p>
      </div>

      {/* Main Content - Single scrollable column */}
      <div style={{ padding: '10px', maxWidth: '100%' }}>
        {/* Error/Status */}
        {error && <div style={{ padding: '5px', backgroundColor: '#ffcccc', fontSize: '11px', marginBottom: '5px' }}>{error}</div>}

        {/* Program List - Dense */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: '5px 0', fontSize: '13px' }}>Programs</h4>
          {state.programs.map(program => (
            <div
              key={program.id}
              style={{
                border: '1px solid #ccc',
                padding: '5px',
                marginBottom: '5px',
                backgroundColor: selectedProgram === program.id ? '#e3f2fd' : '#fff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onClick={() => setSelectedProgram(program.id)}
            >
              <div>{program.name}</div>
              {selectedProgram === program.id && program.options && (
                <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #ddd' }}>
                  {program.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={e => {
                        e.stopPropagation();
                        handleVote(program.id, opt.id);
                      }}
                      disabled={sending || isDisabled}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '3px',
                        margin: '2px 0',
                        fontSize: '11px',
                        backgroundColor: isDisabled ? '#ccc' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        cursor: isDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {opt.label} ({(votes[opt.id] || opt.votes || 0)} votes)
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Messages Section - Dense */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: '5px 0', fontSize: '13px' }}>Live Messages</h4>
          <div style={{ border: '1px solid #ccc', padding: '5px', height: '80px', overflowY: 'auto', fontSize: '11px', marginBottom: '5px' }}>
            {state.messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: '3px', padding: '2px', borderBottom: '1px solid #eee' }}>
                <strong>{msg.author}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={sending || isDisabled}
            placeholder="Type message..."
            style={{
              width: '100%',
              padding: '3px',
              fontSize: '11px',
              marginBottom: '3px',
              opacity: isDisabled ? 0.5 : 1
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !message.trim() || isDisabled}
            style={{
              width: '100%',
              padding: '5px',
              fontSize: '11px',
              backgroundColor: isDisabled ? '#ccc' : '#28a745',
              color: '#fff',
              border: 'none',
              cursor: isDisabled ? 'not-allowed' : 'pointer'
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Queue Info - Minimal */}
        <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }}>
          <div>Queue Length: {state.queue_length}</div>
          <div>Crowdedness: {state.crowdedness}</div>
        </div>

        {/* State Warning - if not normal */}
        {!isDisabled && <div style={{ fontSize: '11px', color: '#666' }}>Installation is operational</div>}
        {isDisabled && (
          <div style={{ backgroundColor: '#fff3cd', padding: '5px', fontSize: '11px', color: '#856404' }}>
            Installation is {state.installation_state}. Interactions disabled.
          </div>
        )}
      </div>
    </div>
  );
}
