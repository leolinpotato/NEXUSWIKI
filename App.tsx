/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { streamDefinition } from './services/geminiService';
import { storageService, HistoryItem, Collection, CollectionItem, User } from './services/storageService';
import { supabase } from './services/supabaseClient';
import ContentDisplay from './components/ContentDisplay';
import SearchBar from './components/SearchBar';
import LoadingSkeleton from './components/LoadingSkeleton';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import SaveModal from './components/SaveModal';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // App State
  const [currentTopic, setCurrentTopic] = useState<string>('Hypertext');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [language, setLanguage] = useState<string>('English');
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Data State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Auth & Initial Data Loading ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = (session: any) => {
    if (session?.user) {
       // --- "Approved User" Logic ---
       const email = session.user.email;
       const isApproved = 
        email?.endsWith('@google.com') || 
        email?.endsWith('@gmail.com') || 
        email === 'demo@nexuswiki.com';
       
       if (!isApproved) {
         supabase.auth.signOut();
         alert("Access Denied: This app is restricted to Google accounts.");
         setUser(null);
         return;
       }

       setUser({
         email: session.user.email,
         name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
         id: session.user.id
       });
       
       // Load data for user
       loadUserData();
    } else {
      setUser(null);
      setHistory([]);
      setCollections([]);
    }
  };

  const loadUserData = async () => {
    try {
      const [histData, colData] = await Promise.all([
        storageService.getHistory(),
        storageService.getCollections()
      ]);
      setHistory(histData);
      setCollections(colData);
      
      // Only fetch default content if we are just starting up and have no content
      // Note: We avoid dependency loops by checking if content is empty inside the effect logic
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  };

  // Initial Content Fetch (Only once after login)
  useEffect(() => {
    if (user && !content && isLoading) {
      fetchContent('Hypertext', 'English', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Run when user is set

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
  };

  const fetchContent = useCallback(async (topic: string, lang: string, saveToHistory = true) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);
    setContent('');
    setGenerationTime(null);
    setCurrentTopic(topic);
    setLanguage(lang);

    const startTime = performance.now();
    let accumulatedContent = '';

    try {
      for await (const chunk of streamDefinition(topic, lang)) {
        if (abortController.signal.aborted) break;
        if (chunk.startsWith('Error:')) throw new Error(chunk);
        
        accumulatedContent += chunk;
        setContent(accumulatedContent);
      }

      if (!abortController.signal.aborted) {
        const endTime = performance.now();
        setGenerationTime(endTime - startTime);
        
        if (saveToHistory) {
          // Async update
          storageService.addToHistory({
            topic,
            content: accumulatedContent,
            language: lang
          }).then(updatedHistory => {
             setHistory(updatedHistory);
          });
        }
      }
    } catch (e: unknown) {
      if (!abortController.signal.aborted) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Handlers
  const handleWordClick = useCallback((word: string) => {
    const newTopic = word.trim();
    if (newTopic && newTopic.toLowerCase() !== currentTopic.toLowerCase()) {
      fetchContent(newTopic, language, true);
    }
  }, [currentTopic, language, fetchContent]);

  const handleSearch = useCallback((topic: string) => {
    fetchContent(topic.trim(), language, true);
  }, [language, fetchContent]);

  // Sidebar Selection Handlers (No regeneration)
  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentTopic(item.topic);
    setContent(item.content);
    setLanguage(item.language);
    setIsLoading(false);
    setError(null);
    setGenerationTime(null);
  };

  const handleSelectCollectionItem = (item: CollectionItem) => {
    setCurrentTopic(item.topic);
    setContent(item.content);
    setIsLoading(false);
    setError(null);
    setGenerationTime(null);
  };

  const handleSaveBookmark = async (collectionId: string, newCollectionName?: string) => {
    const updatedCollections = await storageService.saveToCollection(collectionId, {
      topic: currentTopic,
      content: content
    }, newCollectionName);
    setCollections(updatedCollections);
    setIsSaveModalOpen(false);
  };

  if (authChecking) {
    return <div className="login-container">Loading...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div>
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        history={history}
        collections={collections}
        onSelectHistory={handleSelectHistory}
        onSelectCollectionItem={handleSelectCollectionItem}
        onLogout={handleLogout}
        userEmail={user.email}
      />

      {/* Main Content Area - shifts when sidebar is open on large screens */}
      <div className={`main-wrapper ${isSidebarOpen ? 'shifted' : ''}`}>
        
        <div style={{ position: 'absolute', top: '2rem', left: '1rem' }}>
          <button onClick={() => setIsSidebarOpen(true)} className="menu-btn" aria-label="Open Sidebar">
             <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>

        <SearchBar 
          onSearch={handleSearch} 
          isLoading={isLoading}
          selectedLanguage={language}
          onLanguageChange={(lang) => fetchContent(currentTopic, lang, true)}
        />
        
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            NEXUSWIKI
          </h1>
        </header>
        
        <main>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
              <h2 style={{ textTransform: 'capitalize', margin: 0 }}>
                {currentTopic}
              </h2>
              
              {!isLoading && content && (
                <button 
                  onClick={() => setIsSaveModalOpen(true)}
                  className="bookmark-btn"
                  title="Bookmark to Collection"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              )}
            </div>

            {error && (
              <div style={{ border: '1px solid #cc0000', padding: '1rem', color: '#cc0000' }}>
                <p style={{ margin: 0 }}>An Error Occurred</p>
                <p>{error}</p>
              </div>
            )}
            
            {isLoading && content.length === 0 && !error && (
              <LoadingSkeleton />
            )}

            {content.length > 0 && !error && (
               <ContentDisplay 
                 content={content} 
                 isLoading={isLoading} 
                 onWordClick={handleWordClick}
                 language={language}
               />
            )}
          </div>
        </main>

        <footer className="sticky-footer">
          <p className="footer-text" style={{ margin: 0 }}>
            NexusWiki · Intelligent Knowledge Graph
            {generationTime && ` · ${Math.round(generationTime)}ms`}
          </p>
        </footer>
      </div>

      <SaveModal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        onSave={handleSaveBookmark}
        collections={collections}
      />
    </div>
  );
};

export default App;
