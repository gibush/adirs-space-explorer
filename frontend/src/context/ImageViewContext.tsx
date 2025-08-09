import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ImageViewData {
  id: string;
  name: string;
  description: string;
  launch_date: string;
  image_url?: string;
  canonical_url?: string;
  type: string;
  keywords: string[];
  photographer: string;
  search: boolean;
  confidence_score?: number;
}

type ImageViewContextValue = {
  imageData: ImageViewData | null;
  setImageData: React.Dispatch<React.SetStateAction<ImageViewData | null>>;
};

const ImageViewContext = createContext<ImageViewContextValue | undefined>(undefined);

export const ImageViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [imageData, setImageData] = useState<ImageViewData | null>(null);

  return (
    <ImageViewContext.Provider value={{ imageData, setImageData }}>
      {children}
    </ImageViewContext.Provider>
  );
};

export const useImageViewContext = () => {
  const context = useContext(ImageViewContext);
  if (!context) {
    throw new Error('useImageViewContext must be used within ImageViewProvider');
  }
  return context;
};

export const useImageView = () => {
  const { imageData, setImageData } = useImageViewContext();

  const openImageView = useCallback((data: ImageViewData) => {
    setImageData(data);
  }, [setImageData]);

  const clean = useCallback(() => {
    setImageData(null);
  }, [setImageData]);

  const isOpen = Boolean(imageData);

  return {
    imageData,
    isOpen,
    openImageView,
    clean,
    setImageData
  };
};
