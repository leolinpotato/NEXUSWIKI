/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const LoginScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Redirect back to this app
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
           <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path d="M50 10L85 30V70L50 90L15 70V30L50 10Z" fill="black"/>
              <circle cx="50" cy="50" r="12" fill="white"/>
              <path d="M50 25V38M28 62L39 56M72 62L61 56" stroke="white" strokeWidth="6" strokeLinecap="round"/>
           </svg>
        </div>
        <h1 className="login-title">NEXUSWIKI</h1>
        <p className="login-subtitle">The Infinite Knowledge Graph</p>
        
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="google-btn"
        >
          {loading ? (
             <span>Connecting...</span>
          ) : (
            <>
              <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.704H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957C.347 6.173 0 7.55 0 9c0 1.45.348 2.827.957 4.044l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956l3.007 2.332c.708-2.12 2.692-3.704 5.036-3.704z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>
        
        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">Protected System. Authorized Personnel Only.</p>
      </div>
    </div>
  );
};

export default LoginScreen;
