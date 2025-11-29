/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { HistoryItem, Collection, CollectionItem } from '../services/storageService';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  history: HistoryItem[];
  collections: Collection[];
  onSelectHistory: (item: HistoryItem) => void;
  onSelectCollectionItem: (item: CollectionItem) => void;
  onLogout: () => void;
  userEmail: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  history,
  collections,
  onSelectHistory,
  onSelectCollectionItem,
  onLogout,
  userEmail
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['history', 'fav'])); // Default open history and favorites

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const FolderIcon = ({ open }: { open: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      {!open && <path d="M2 10h20" stroke="transparent" />} 
    </svg>
  );

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onToggle} />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
           <div className="sidebar-logo">
             NEXUSWIKI
           </div>
           <button onClick={onToggle} className="close-btn">
             <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
           </button>
        </div>

        <div className="sidebar-content">
          
          {/* History Section */}
          <div className="folder-row">
            <button className="folder-toggle" onClick={() => toggleFolder('history')}>
              <span className={`chevron ${expanded.has('history') ? 'down' : 'right'}`}>▶</span>
              <FolderIcon open={expanded.has('history')} />
              Search History
            </button>
            {expanded.has('history') && (
              <div className="folder-items">
                {history.length === 0 ? (
                  <div className="empty-state">No history</div>
                ) : (
                  history.map(item => (
                    <button key={item.id} className="sidebar-item" onClick={() => { onSelectHistory(item); if(window.innerWidth < 768) onToggle(); }}>
                      <span className="item-text">{item.topic}</span>
                      <span className="item-lang">{item.language.slice(0, 2)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Collections Section */}
          <div className="collections-divider">COLLECTIONS</div>
          
          {collections.map(col => (
             <div key={col.id} className="folder-row">
              <button className="folder-toggle" onClick={() => toggleFolder(col.id)}>
                <span className={`chevron ${expanded.has(col.id) ? 'down' : 'right'}`}>▶</span>
                <FolderIcon open={expanded.has(col.id)} />
                {col.name}
              </button>
              {expanded.has(col.id) && (
                <div className="folder-items">
                  {col.items.length === 0 ? (
                    <div className="empty-state">Empty</div>
                  ) : (
                    col.items.map(item => (
                      <button key={item.id} className="sidebar-item" onClick={() => { onSelectCollectionItem(item); if(window.innerWidth < 768) onToggle(); }}>
                         <span className="item-text">{item.topic}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}

        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{userEmail[0].toUpperCase()}</div>
            <div className="user-email">{userEmail}</div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Log out
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
