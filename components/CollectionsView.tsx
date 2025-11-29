/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ContentDisplay from './ContentDisplay';

export interface SavedItem {
  id: string;
  topic: string;
  content: string;
  timestamp: number;
}

export interface CollectionData {
  id: string;
  name: string;
  items: SavedItem[];
}

interface CollectionsViewProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionData[];
  onLoadItem: (item: SavedItem) => void;
  onDeleteCollection: (id: string) => void;
}

const CollectionsView: React.FC<CollectionsViewProps> = ({ 
  isOpen, 
  onClose, 
  collections, 
  onLoadItem,
  onDeleteCollection
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>My Collections</h3>
          <button onClick={onClose} className="icon-button">✕</button>
        </div>
        
        {collections.length === 0 ? (
          <p style={{ color: '#888' }}>No collections saved yet.</p>
        ) : (
          <div className="collections-list">
            {collections.map(collection => (
              <div key={collection.id} className="collection-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>{collection.name}</h4>
                  <button 
                    onClick={() => {
                        if(confirm(`Delete collection "${collection.name}"?`)) onDeleteCollection(collection.id);
                    }}
                    style={{ color: '#cc0000', fontSize: '0.8em' }}
                  >
                    delete
                  </button>
                </div>
                
                {collection.items.length === 0 ? (
                  <p style={{ fontSize: '0.9em', color: '#ccc' }}>Empty</p>
                ) : (
                  <ul className="saved-items-list">
                    {collection.items.map(item => (
                      <li key={item.id}>
                        <button 
                          className="saved-item-link"
                          onClick={() => {
                            onLoadItem(item);
                            onClose();
                          }}
                        >
                          {item.topic}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsView;