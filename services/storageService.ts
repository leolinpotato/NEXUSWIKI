/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { supabase } from './supabaseClient';

export interface User {
  email: string;
  name: string;
  avatar?: string;
  id?: string;
}

export interface HistoryItem {
  id: string;
  topic: string;
  content: string;
  language: string;
  timestamp: number;
}

export interface CollectionItem {
  id: string;
  topic: string;
  content: string;
  timestamp: number;
}

export interface Collection {
  id: string;
  name: string;
  items: CollectionItem[];
}

export const storageService = {
  // --- User Authentication ---
  // Note: Auth state is primarily managed in App.tsx via supabase.auth.onAuthStateChange

  async logout() {
    await supabase.auth.signOut();
  },

  // --- History Management ---
  async getHistory(): Promise<HistoryItem[]> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      topic: item.topic,
      content: item.content,
      language: item.language,
      timestamp: new Date(item.created_at).getTime(),
    }));
  },

  async addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<HistoryItem[]> {
    // 1. Insert new item
    const { error } = await supabase
      .from('search_history')
      .insert({
        topic: item.topic,
        content: item.content,
        language: item.language,
      });

    if (error) {
      console.error('Error adding to history:', error);
    }

    // 2. Return updated history
    return await storageService.getHistory();
  },

  // --- Collection Management ---
  async getCollections(): Promise<Collection[]> {
    // Fetch collections
    const { data: collectionsData, error: colError } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: true });

    if (colError || !collectionsData) {
      console.error('Error fetching collections:', colError);
      return [];
    }

    // Fetch all items for these collections (optimization: could be join or separate call)
    // Here we use a separate call for simplicity in structure
    const collections: Collection[] = [];

    for (const col of collectionsData) {
      const { data: itemsData } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', col.id)
        .order('created_at', { ascending: false });

      collections.push({
        id: col.id,
        name: col.name,
        items: (itemsData || []).map((i: any) => ({
          id: i.id,
          topic: i.topic,
          content: i.content,
          timestamp: new Date(i.created_at).getTime(),
        })),
      });
    }

    return collections;
  },

  async saveToCollection(
    collectionId: string, 
    item: Omit<CollectionItem, 'id' | 'timestamp'>, 
    newCollectionName?: string
  ): Promise<Collection[]> {
    
    let targetCollectionId = collectionId;

    // Create new collection if needed
    if (collectionId === 'new' && newCollectionName) {
      const { data: newCol, error: createError } = await supabase
        .from('collections')
        .insert({ name: newCollectionName })
        .select()
        .single();
      
      if (createError || !newCol) {
        console.error('Error creating collection:', createError);
        return await storageService.getCollections();
      }
      targetCollectionId = newCol.id;
    }

    // Add item to collection
    // Check if duplicate exists for this collection (optional, based on logic)
    const { error: insertError } = await supabase
      .from('collection_items')
      .insert({
        collection_id: targetCollectionId,
        topic: item.topic,
        content: item.content
      });

    if (insertError) {
      console.error('Error adding item to collection:', insertError);
    }

    return await storageService.getCollections();
  },
  
  async deleteFromCollection(collectionId: string, itemId: string): Promise<Collection[]> {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId);

    if (error) console.error('Error deleting item:', error);

    return await storageService.getCollections();
  }
};
