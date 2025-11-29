/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { Collection } from '../services/storageService';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionId: string, newCollectionName?: string) => void;
  collections: Collection[];
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, onClose, onSave, collections }) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections.length > 0 ? collections[0].id : 'new');
  const [newCollectionName, setNewCollectionName] = useState('');

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (selectedCollectionId === 'new' && !newCollectionName.trim()) {
      return; // Prevent saving empty name
    }
    onSave(selectedCollectionId, newCollectionName);
    setNewCollectionName('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Bookmark Topic</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {collections.length > 0 && (
             <div style={{ marginBottom: '1rem' }}>
               <label className="radio-label">
                 <input 
                   type="radio" 
                   name="collection" 
                   value="existing"
                   checked={selectedCollectionId !== 'new'} 
                   onChange={() => setSelectedCollectionId(collections[0].id)}
                 />
                 Existing Collection
               </label>
               <select 
                 className="modal-select"
                 value={selectedCollectionId === 'new' ? '' : selectedCollectionId}
                 onChange={(e) => setSelectedCollectionId(e.target.value)}
                 disabled={selectedCollectionId === 'new'}
               >
                 {collections.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
             </div>
          )}

          <div>
             <label className="radio-label">
               <input 
                 type="radio" 
                 name="collection" 
                 value="new"
                 checked={selectedCollectionId === 'new'} 
                 onChange={() => setSelectedCollectionId('new')}
               />
               New Collection
             </label>
             <input 
               type="text" 
               className="modal-input"
               placeholder="Collection Name (e.g., Research)"
               value={newCollectionName}
               onChange={(e) => setNewCollectionName(e.target.value)}
               disabled={selectedCollectionId !== 'new'}
             />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="modal-btn cancel">Cancel</button>
          <button onClick={handleSaveClick} className="modal-btn save">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;
