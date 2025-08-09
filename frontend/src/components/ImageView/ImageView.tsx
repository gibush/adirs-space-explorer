import React, { useState, useEffect, useRef } from 'react';
import { useImageView } from '../../context/ImageViewContext';
import Modal from '../shared/Modal/Modal';
import dayjs from 'dayjs';
import { MdClose } from 'react-icons/md';

export interface ImageCardData {
  id: string;
  name: string;
  description: string;
  launch_date: string;
  image_url: string;
  canonical_url?: string;
  type: string;
  keywords: string[];
  photographer: string;
  search: boolean;
  confidence_score?: number;
}

const ImageView: React.FC = () => {
  const { imageData, clean } = useImageView();
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const leftColumnRef = useRef<HTMLDivElement | null>(null);
  const titleCardRef = useRef<HTMLDivElement | null>(null);
  const [descriptionMaxHeight, setDescriptionMaxHeight] = useState<string | undefined>(undefined);

  const getImageSrc = () => {
    if (!imageData) return '';
    
    const canonicalUrl = imageData.canonical_url;
    if (canonicalUrl && canonicalUrl.toLowerCase().endsWith('.tif')) {
      return imageData.image_url;
    }
    
    return canonicalUrl || imageData.image_url;
  };

  const getFormattedLaunchDate = () => {
    if (!imageData?.launch_date) return 'Date not available';
    
    try {
      return dayjs(imageData.launch_date).format('MMMM DD, YYYY');
    } catch (error) {
      console.warn('Error formatting date:', error);
      return imageData.launch_date;
    }
  };

  useEffect(() => {
    if (imageData) {
      setIsLoading(true);
      setImageLoaded(false);
    }
  }, [imageData]);

  useEffect(() => {
    if (imageData && imageLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [imageData, imageLoaded]);

  useEffect(() => {
    const computeDescriptionMaxHeight = () => {
      const columnEl = leftColumnRef.current;
      const titleEl = titleCardRef.current;
      if (!columnEl || !titleEl) {
        setDescriptionMaxHeight(undefined);
        return;
      }
      const gapPx = 16; // gap-4 between title and description
      const available = columnEl.clientHeight - titleEl.clientHeight - gapPx;
      setDescriptionMaxHeight(available > 0 ? `${available}px` : undefined);
    };
    computeDescriptionMaxHeight();
    window.addEventListener('resize', computeDescriptionMaxHeight);
    return () => window.removeEventListener('resize', computeDescriptionMaxHeight);
  }, [isLoading, imageData]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return imageData && (
    <div>
        <Modal 
          isOpen={!!imageData} 
          onClose={clean}
          containerClassName="w-screen max-w-none h-[90vh] overflow-hidden flex items-center p-0"
          backdropClassName="bg-black/75 backdrop-blur-md"
        >
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 w-full h-full">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
              <p className="text-white text-sm"></p>
            </div>
          )}
          
          {!isLoading && (
            <div className="flex flex-col gap-4 w-full h-full min-h-0">
              <div className="flex justify-start">
                <button 
                  onClick={clean}
                  className="hover:bg-white hover:bg-opacity-10 p-1 ml-4 transition-colors duration-200"
                  aria-label="Close"
                >
                  <MdClose className="text-white text-4xl" />
                </button>
              </div>
              <div className="flex gap-4 w-full flex-1 min-h-0">
                <div ref={leftColumnRef} className="flex flex-col gap-4 w-[28rem] h-full min-h-0 overflow-hidden">
                  <div ref={titleCardRef} className="bg-white border border-white rounded-r-lg shadow-xl p-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 break-words overflow-wrap-anywhere">
                      "{imageData.name}"
                    </h2>
                    <div className="text-sm text-gray-600">
                      <p>{getFormattedLaunchDate()}</p>
                      {imageData.photographer && (
                        <p className="mt-1">
                          <span className="font-semibold">Photographer:</span> {imageData.photographer}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white border border-white rounded-r-lg shadow-xl overflow-y-auto overflow-x-hidden" style={{ maxHeight: descriptionMaxHeight }}>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">What's in the image?</h3>
                      <p className="text-gray-700 leading-relaxed break-words">
                        {imageData.description}
                      </p>
                      {imageData.keywords && imageData.keywords.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {imageData.keywords.map((keyword, index) => (
                            <span key={index} className="text-gray-600 font-bold text-sm break-words">
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center min-w-0 min-h-0 h-full overflow-hidden rounded-lg px-4">
                  <img 
                      src={getImageSrc()} 
                      alt={imageData.name} 
                      className="max-w-full max-h-full object-contain rounded-[0.5rem]"
                  />
                </div>
              </div>
            </div>
          )}
          
          <img 
            src={getImageSrc()} 
            alt="" 
            className="hidden"
            onLoad={handleImageLoad}
          />
        </Modal>
    </div>
  );
};

export default ImageView;
