import React, { useCallback, useEffect } from 'react';
import { Masonry, useInfiniteLoader } from "masonic";
import ImageCard from "../ImageCard/ImageCard";
import { isMobile } from 'react-device-detect';
import { useImageData } from '../../context/ImageDataContext';
import { useImageSearch } from '../../context/ImageSearchContext';
import { ImageData } from '../../context/ImageDataContext';

const PAGE_SIZE = 60;

const Grid: React.FC = () => {
  const { images, loading, error, isLoadingMore, loadMore, refresh } = useImageData();
  const { activeSearchTerm } = useImageSearch();

  const computedColumnWidth = isMobile ? 150 : 450;

  // Trigger search when activeSearchTerm changes
  useEffect(() => {
    refresh(activeSearchTerm);
  }, [activeSearchTerm, refresh]);

  const maybeLoadMore = useInfiniteLoader(
    useCallback(
      async (startIndex: number, stopIndex: number, items: ImageData[]) => {
        await loadMore(startIndex, stopIndex, items, activeSearchTerm);
      },
      [loadMore, activeSearchTerm]
    ),
    { isItemLoaded: (index: number, items: ImageData[]) => index < items.length, minimumBatchSize: PAGE_SIZE, threshold: 30 }
  );

  const renderCard = useCallback(
    ({ data }: { data: ImageData }) => <ImageCard data={data} />,
    []
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (images.length === 0) {
    return <div className="text-gray-500 text-center p-4">No images found.</div>;
  }

  return (
    <div className="w-full px-4 py-8">
      <Masonry<ImageData>
        items={images}
        columnGutter={22}
        columnWidth={computedColumnWidth}
        overscanBy={4}
        itemKey={(item, index) => item?.id || `placeholder-${index}`}
        onRender={maybeLoadMore}
        render={renderCard}
      />
      {isLoadingMore && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  );
};

export default Grid;