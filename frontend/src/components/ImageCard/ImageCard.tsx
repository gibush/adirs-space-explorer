import React from 'react';
import { useImageView } from '../../context/ImageViewContext';

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

const ImageCard: React.FC<{ data: ImageCardData }> = ({ data }) => {
  const { setImageData } = useImageView();

  const handleClick = () => {
    setImageData(data);
  }

  const getConfidenceChipColor = (score: number) => {
    if (score < 0.1) return 'bg-red-200 text-red-800';
    if (score < 0.5) return 'bg-orange-200 text-orange-800';
    return 'bg-green-200 text-green-800';
  };

  const confidencePercentage = data.confidence_score ? Math.round(data.confidence_score * 100) : 0;

  return (
    <div
      onClick={handleClick}
      className="group rounded-md overflow-hidden bg-black cursor-pointer relative">
        {data.search && data.confidence_score !== undefined && (
          <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceChipColor(data.confidence_score)}`}>
            Matches your search by {confidencePercentage}%
          </div>
        )}
        {data.image_url && (
          <img
            src={data.image_url}
            alt={data.name}
            className="rounded-md brightness-75 group-hover:brightness-100 transition-all duration-150 ease-in-out group-hover:scale-[1.01]"
            loading="lazy"
          />
        )}
    </div>
  );
};

export default ImageCard;
