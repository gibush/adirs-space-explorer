import React, { createContext, useContext, useState, useCallback } from 'react';

type ImageSearchContextValue = {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  activeSearchTerm: string;
  performSearch: (term?: string) => void;
};

const ImageSearchContext = createContext<ImageSearchContextValue | undefined>(undefined);

export const ImageSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>('');

  const performSearch = useCallback((term?: string) => {
    const searchQuery = term ?? searchTerm;
    setActiveSearchTerm(searchQuery);
  }, [searchTerm]);

  return (
    <ImageSearchContext.Provider value={{ 
      searchTerm, 
      setSearchTerm, 
      activeSearchTerm, 
      performSearch 
    }}>
      {children}
    </ImageSearchContext.Provider>
  );
};

export const useImageSearchContext = () => {
  const context = useContext(ImageSearchContext);
  if (!context) {
    throw new Error('useImageSearchContext must be used within ImageSearchProvider');
  }
  return context;
};

export const useImageSearch = () => {
  const { searchTerm, setSearchTerm, activeSearchTerm, performSearch } = useImageSearchContext();

  const clean = useCallback(() => {
    setSearchTerm('');
  }, [setSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    performSearch,
    clean
  };
};
