import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: string;
}

export const MissionControl: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'system',
      text: 'SOGNA COMMAND CENTER INITIALIZED. Awaiting strategic directives.',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate system response
    setTimeout(() => {
      const sysMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: `Directive received: "${userMsg.text}". Orchestrator agent has been dispatched to coordinate swarm execution.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, sysMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sogna-border)' }}>
        <h3 className="font-display" style={{ margin: 0, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--sogna-text)' }}>
          Mission Control
        </h3>
        <div className="font-display" style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
          Natural Language Swarm Directives
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div className="mono" style={{ fontSize: '9px', opacity: 0.4, marginBottom: '4px' }}>
                  {msg.sender === 'user' ? 'OPERATOR' : 'SOGNA_CORE'} // {msg.timestamp}
                </div>
                <div 
                  className="mono"
                  style={{
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    background: msg.sender === 'user' ? 'rgba(0, 219, 110, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${msg.sender === 'user' ? 'var(--sogna-primary)' : 'var(--sogna-border)'}`,
                    color: msg.sender === 'user' ? 'var(--sogna-primary)' : 'var(--sogna-text)',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'flex-start' }}>
              <div className="mono" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px 12px 12px 0', border: '1px solid var(--sogna-border)', fontSize: '12px' }}>
                <span className="text-gradient">Processing directive...</span>
              </div>
            </motion.div>
          )}
          <div ref={endOfMessagesRef} />
        </AnimatePresence>
      </div>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--sogna-border)', background: 'var(--sogna-surface)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Assign a strategic objective to the swarm..."
            className="font-display"
            style={{ 
              flex: 1, 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--sogna-border)', 
              borderRadius: '8px', 
              padding: '12px 16px',
              color: 'var(--sogna-text)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            className="premium-button"
            disabled={!input.trim()}
            style={{ 
              padding: '0 24px', 
              borderRadius: '8px',
              background: input.trim() ? 'var(--sogna-primary)' : 'rgba(255,255,255,0.05)',
              color: input.trim() ? '#000' : 'var(--sogna-text-muted)',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              opacity: input.trim() ? 1 : 0.5,
              cursor: input.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Dispatch
          </button>
        </form>
      </div>
    </div>
  );
};
