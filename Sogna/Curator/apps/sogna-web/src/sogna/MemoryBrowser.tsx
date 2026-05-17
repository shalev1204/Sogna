import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sognaBridge } from '../services/TelemetryBridge.js';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

interface MemoryBrowserProps {
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);

const IconFile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);

const TreeNode: React.FC<{ node: FileNode; onSelect: (path: string) => void; selectedPath?: string; depth: number }> = ({ node, onSelect, selectedPath, depth }) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isSelected = selectedPath === node.path;

  return (
    <div style={{ marginLeft: depth > 0 ? '1rem' : 0 }}>
      <div 
        onClick={() => {
          if (node.type === 'directory') setIsOpen(!isOpen);
          else onSelect(node.path);
        }}
        className={`tree-node ${isSelected ? 'active' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          borderRadius: '4px',
          fontSize: '11px',
          transition: 'all 0.2s ease',
          color: isSelected ? 'var(--sogna-primary)' : 'rgba(255,255,255,0.7)',
          backgroundColor: isSelected ? 'rgba(var(--sogna-primary-rgb), 0.1)' : 'transparent',
          marginBottom: '2px'
        }}
      >
        <span style={{ opacity: 0.5 }}>
          {node.type === 'directory' ? <IconFolder /> : <IconFile />}
        </span>
        <span style={{ fontWeight: isSelected ? 700 : 400 }}>{node.name}</span>
      </div>
      
      {node.type === 'directory' && isOpen && node.children && (
        <div className="tree-children">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} onSelect={onSelect} selectedPath={selectedPath} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const MemoryBrowser: React.FC<MemoryBrowserProps> = ({ onFileSelect, selectedPath }) => {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    const unsubTree = sognaBridge.onMessage('MEMORY_TREE', (data) => {
      setTree(data);
      setLoading(false);
    });

    const unsubSearch = sognaBridge.onMessage('SEARCH_RESULTS', (data) => {
      setSearchResults(data);
    });

    sognaBridge.fetchMemoryTree();

    return () => {
      unsubTree();
      unsubSearch();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    sognaBridge.searchMemory(searchQuery);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sogna-border)', background: 'rgba(255,255,255,0.01)' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '10px', letterSpacing: '0.2em', opacity: 0.5, fontWeight: 700 }}>NEURAL_DISCOVERY</h4>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            className="mono"
            placeholder="SEARCH_CONCEPTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1, 
              background: 'rgba(0, 242, 255, 0.03)', 
              border: '1px solid var(--sogna-border)', 
              color: 'white', 
              fontSize: '11px', 
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--sogna-primary)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--sogna-border)'}
          />
        </form>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <AnimatePresence mode="wait">
          {searchResults ? (
            <motion.div 
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>{searchResults.length} FRAGMENTS_FOUND</span>
                <button 
                  onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--sogna-primary)', cursor: 'pointer', fontSize: '10px' }}
                >
                  CLEAR
                </button>
              </div>
              {searchResults.map((result, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onFileSelect(result.metadata?.path || result.key)}
                  className="search-result-item"
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid var(--sogna-border)', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '0.75rem', 
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--sogna-primary)', fontWeight: 700 }}>{result.key}</span>
                    <span className="mono" style={{ 
                      fontSize: '9px', 
                      padding: '2px 6px', 
                      background: 'rgba(0, 242, 255, 0.1)', 
                      borderRadius: '4px',
                      color: 'var(--sogna-primary)'
                    }}>{(result.relevance * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mono" style={{ fontSize: '10px', opacity: 0.5, lineHeight: 1.4, height: '2.8em', overflow: 'hidden' }}>
                    {result.content.substring(0, 120)}...
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mono"
              style={{ fontSize: '10px', opacity: 0.3 }}
            >
              SCANNING_NEURAL_STORAGE...
            </motion.div>
          ) : tree ? (
            <motion.div
              key="tree"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="mono" style={{ fontSize: '10px', opacity: 0.4 }}>MEMORY_STRUCTURE</span>
                <button 
                  onClick={() => { setLoading(true); sognaBridge.fetchMemoryTree(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--sogna-primary)', cursor: 'pointer', fontSize: '10px' }}
                >
                  REFRESH
                </button>
              </div>
              <TreeNode node={tree} onSelect={onFileSelect} selectedPath={selectedPath} depth={0} />
            </motion.div>
          ) : (
            <div className="mono" style={{ fontSize: '10px', opacity: 0.3 }}>FAILED_TO_LOAD_MEMORY</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
