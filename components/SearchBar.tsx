/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const LANGUAGES = [
  'English',
  'Traditional Chinese',
  'Simplified Chinese',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Hindi',
  'Portuguese',
  'Russian',
  'Italian'
];

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  isLoading,
  selectedLanguage,
  onLanguageChange
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery(''); // Clear the input field after search
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="search-input"
          aria-label="Search for a topic"
          disabled={isLoading}
        />
      </form>
      
      <div className="controls-group">
        <select 
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="language-select"
          disabled={isLoading}
          aria-label="Select Language"
        >
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchBar;