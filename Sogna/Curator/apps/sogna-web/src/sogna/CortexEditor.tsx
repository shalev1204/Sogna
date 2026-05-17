import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { sognaBridge } from '../services/TelemetryBridge.js';

interface CortexEditorProps {
  filePath: string;
}

export const CortexEditor: React.FC<CortexEditorProps> = ({ filePath }) => {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [mode, setMode] = useState<'edit' | 'preview'>('preview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<any>(null);

  useEffect(() => {
    const handleContent = (data: any) => {
      if (data.path === filePath) {
        setContent(data.content);
        setOriginalContent(data.content);
        setLoading(false);
      }
    };

    const handleSaved = (data: any) => {
      if (data.path === filePath && data.success) {
        setSaving(false);
        setOriginalContent(content);
      }
    };

    const unsubContent = sognaBridge.onMessage('MEMORY_FILE_CONTENT', handleContent);
    const unsubSaved = sognaBridge.onMessage('MEMORY_FILE_SAVED', handleSaved);

    setLoading(true);
    sognaBridge.readMemoryFile(filePath);

    return () => {
      unsubContent();
      unsubSaved();
    };
  }, [filePath]);

  const handleSave = () => {
    if (content === originalContent) return;
    setSaving(true);
    sognaBridge.writeMemoryFile(filePath, content);
  };

  // Auto-save logic
  useEffect(() => {
    if (content !== originalContent && content !== '') {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [content]);

  // Convert [[link]] to [link](sogna://link) for ReactMarkdown
  const processedContent = content.replace(/\[\[(.*?)\]\]/g, '[$1](sogna://$1)');

  const handleLinkClick = (href: string) => {
    if (href.startsWith('sogna://')) {
      const linkTarget = href.replace('sogna://', '');
      // Trigger search or open file if exact match found
      sognaBridge.searchMemory(linkTarget);
    }
  };

  return (
    <div className="cortex-editor" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* HEADER */}
      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--sogna-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>FILE: {filePath}</span>
          {saving && <span className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)' }}>SAVING...</span>}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setMode('edit')}
            className={`view-btn ${mode === 'edit' ? 'active' : ''}`}
            style={{ padding: '4px 12px' }}
          >
            EDIT
          </button>
          <button 
            onClick={() => setMode('preview')}
            className={`view-btn ${mode === 'preview' ? 'active' : ''}`}
            style={{ padding: '4px 12px' }}
          >
            PREVIEW
          </button>
        </div>
      </div>

      {/* CONTENT + SIDEBAR */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', borderRight: '1px solid var(--sogna-border)' }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="empty-state"
                style={{ width: '100%' }}
              >
                <div className="mono" style={{ fontSize: '12px' }}>DECRYPTING_NEURAL_DATA...</div>
              </motion.div>
            ) : mode === 'edit' ? (
              <motion.textarea
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cortex-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                autoFocus
              />
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cortex-preview"
                style={{ width: '100%' }}
              >
                <ReactMarkdown 
                  components={{
                    a: ({ node, ...props }) => (
                      <a 
                        {...props} 
                        onClick={(e) => {
                          if (props.href?.startsWith('sogna://')) {
                            e.preventDefault();
                            handleLinkClick(props.href);
                          }
                        }}
                        style={{ color: 'var(--sogna-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                      />
                    )
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NEURAL SIDEBAR (The Obsidian-plus Intelligence) */}
        <div style={{ width: '280px', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--sogna-border)' }}>
            <span className="mono" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--sogna-primary)' }}>NEURAL_CONNECTIONS</span>
          </div>
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
             <div className="mono" style={{ fontSize: '10px', opacity: 0.3, marginBottom: '1rem' }}>SEARCHING_FOR_SYNAPSES...</div>
             
             <div style={{ marginBottom: '2rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-secondary)', marginBottom: '0.5rem' }}>SWARM_INSIGHTS</div>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', borderLeft: '2px solid var(--sogna-secondary)' }}>
                   <div className="mono" style={{ fontSize: '10px', marginBottom: '4px' }}>SENTINEL_AUDIT</div>
                   <div className="mono" style={{ fontSize: '9px', opacity: 0.6 }}>Integrity verified. No neural leak detected in this fragment.</div>
                </div>
             </div>

             <div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--sogna-primary)', marginBottom: '0.5rem' }}>BACKLINKS</div>
                <div className="mono" style={{ fontSize: '9px', opacity: 0.4 }}>No incoming synapses recorded for this node yet.</div>
             </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '0.5rem 1.5rem', borderTop: '1px solid var(--sogna-border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,0.01)' }}>
        <div className="mono" style={{ fontSize: '9px', opacity: 0.3 }}>
          CHARS: {content.length} // WORDS: {content.split(/\s+/).filter(Boolean).length}
        </div>
      </div>
    </div>
  );
};
