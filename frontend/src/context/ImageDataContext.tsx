import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { sourcesAPI } from "../api";

export interface ImageData {
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

const PAGE_SIZE = 60;

type ImageDataContextValue = {
  images: ImageData[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  fetchPage: (offset: number, searchQuery?: string) => Promise<void>;
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingRef: React.MutableRefObject<boolean>;
  loadedIdsRef: React.MutableRefObject<Set<string>>;
};

const ImageDataContext = createContext<ImageDataContextValue | undefined>(
  undefined
);

export const ImageDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false);
  const loadedIdsRef = useRef<Set<string>>(new Set());

  const fetchPage = useCallback(async (offset: number, searchQuery?: string) => {
    try {
      isLoadingRef.current = true;
      if (offset > 0) setIsLoadingMore(true);
      const params: any = { offset, limit: PAGE_SIZE };
      if (searchQuery && searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      const response = await sourcesAPI.getSources(params);
      const incomingItems: ImageData[] = (response.data ?? [])
        .filter(Boolean)
        .map((it, i: number) => ({
          ...it,
          id: it?.id ?? `tmp-${offset}-${i}`,
          image_url: it.image_url || '',
        }));

      if (offset === 0) {
        loadedIdsRef.current = new Set();
      }

      const uniqueItems = incomingItems.filter((item) => {
        const isNew = !loadedIdsRef.current.has(item.id);
        if (isNew) {
          loadedIdsRef.current.add(item.id);
        }
        return isNew;
      });

      setImages((prev) =>
        offset === 0 ? uniqueItems : [...prev, ...uniqueItems]
      );
      setHasMore(incomingItems.length === PAGE_SIZE);
    } catch (err) {
      setError("Failed to fetch space images");
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
      setLoading(false);
    }
  }, []);

  return (
    <ImageDataContext.Provider
      value={{
        images,
        loading,
        error,
        hasMore,
        isLoadingMore,
        fetchPage,
        setImages,
        setLoading,
        setError,
        setHasMore,
        setIsLoadingMore,
        isLoadingRef,
        loadedIdsRef,
      }}
    >
      {children}
    </ImageDataContext.Provider>
  );
};

export const useImageDataContext = () => {
  const context = useContext(ImageDataContext);
  if (!context) {
    throw new Error(
      "useImageDataContext must be used within ImageDataProvider"
    );
  }
  return context;
};

export const useImageData = () => {
  const {
    images,
    loading,
    error,
    hasMore,
    isLoadingMore,
    fetchPage,
    setImages,
    setLoading,
    setError,
    setHasMore,
    setIsLoadingMore,
    isLoadingRef,
    loadedIdsRef,
  } = useImageDataContext();

  // Initialize data on first load (empty search)
  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const loadMore = useCallback(
    async (startIndex: number, stopIndex: number, items: ImageData[], searchQuery?: string) => {
      if (!hasMore || isLoadingRef.current) return;
      if (stopIndex < items.length - 1) return;
      await fetchPage(items.length, searchQuery);
    },
    [fetchPage, hasMore, isLoadingRef]
  );

  const refresh = useCallback((searchQuery?: string) => {
    setLoading(true);
    setError(null);
    setImages([]);
    setHasMore(true);
    setIsLoadingMore(false);
    loadedIdsRef.current = new Set();
    fetchPage(0, searchQuery);
  }, [
    fetchPage,
    setLoading,
    setError,
    setImages,
    setHasMore,
    setIsLoadingMore,
    loadedIdsRef,
  ]);

  return {
    images,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
    fetchPage,
  };
};
