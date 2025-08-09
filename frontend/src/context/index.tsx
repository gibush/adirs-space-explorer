import React from 'react';
import { ImageViewProvider } from './ImageViewContext';
import { ImageSearchProvider } from './ImageSearchContext';
import { ImageDataProvider } from './ImageDataContext';

interface ContextProviderProps {
  children: React.ReactNode;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
  return (
    <ImageDataProvider>
      <ImageSearchProvider>
        <ImageViewProvider>
          {children}
        </ImageViewProvider>
      </ImageSearchProvider>
    </ImageDataProvider>
  );
};

export default ContextProvider;
