import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@mui/material";
import { IoSearch } from "react-icons/io5";
import { MdNorth, MdHistory, MdClose } from "react-icons/md";
import { useImageSearch } from "../../context/ImageSearchContext";
import { searchAPI, SearchHistoryEntry } from "../../api";

const SearchBox: React.FC = () => {
  const { searchTerm, setSearchTerm, performSearch } = useImageSearch();
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  const ITEMS_PER_PAGE = 30;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (showHistory) {
      setShowHistory(false);
    }
  };

  const fetchSearchHistory = useCallback(async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingHistory(true);
        // Reset pagination state when fetching fresh data
        setOffset(0);
        setHasMore(true);
        setSearchHistory([]);
      }

      const currentOffset = loadMore ? offset : 0;
      const response = await searchAPI.getHistory({
        offset: currentOffset,
        limit: ITEMS_PER_PAGE
      });

      if (response.data.success) {
        const newItems = response.data.data;
        const totalItems = response.data.total;
        
        setTotal(totalItems);
        
        if (loadMore) {
          // Append new items to existing history
          setSearchHistory(prev => [...prev, ...newItems]);
          setOffset(currentOffset + ITEMS_PER_PAGE);
        } else {
          // Replace with fresh data
          setSearchHistory(newItems);
          setOffset(ITEMS_PER_PAGE);
        }
        
        // Check if there are more items to load
        const totalLoaded = loadMore ? currentOffset + newItems.length : newItems.length;
        setHasMore(totalLoaded < totalItems);
      }
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
    }
  }, [offset]);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setShowHistory(false);
    }, 150);
  };

  const handleHistoryHover = () => {
    clearHideTimeout();
    setShowHistory(true);
    fetchSearchHistory();
  };

  const handleHistoryLeave = () => {
    scheduleHide();
  };

  const handleDropdownEnter = () => {
    clearHideTimeout();
  };

  const handleDropdownLeave = () => {
    setShowHistory(false);
  };

  const handleDeleteHistoryItem = async (searchId: string) => {
    try {
      const response = await searchAPI.deleteSearchEntry(searchId);
      if (response.data.success) {
        // Remove the deleted item from the local state
        setSearchHistory(prev => prev.filter(item => item.id !== searchId));
        // Update total count
        setTotal(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting search history item:', error);
    }
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!showHistory || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchSearchHistory(true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [showHistory, hasMore, isLoadingMore, offset, fetchSearchHistory]);

  const handleHistoryItemClick = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    setShowHistory(false);
    performSearch(searchTerm);
  };

  const handleSearch = () => {
    performSearch();
    setShowHistory(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearHideTimeout();
    };
  }, []);

  return (
    <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md md:w-auto px-4 md:px-0">
      {/* Search Box */}
      <div className="bg-white rounded-lg shadow-2xl drop-shadow-lg p-4 relative">
        {/* Search History Dropdown */}
        {showHistory && (
          <div 
            className="absolute bottom-full mb-2 right-4 md:right-12 w-72 md:w-80 bg-white rounded-lg shadow-2xl drop-shadow-lg max-h-64 overflow-y-auto z-10"
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            {isLoadingHistory ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : searchHistory.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No search history</div>
            ) : (
              <div className="py-2">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer group"
                    onClick={() => handleHistoryItemClick(item.search_term)}
                  >
                    <span className="flex-1 text-gray-700 truncate">{item.search_term}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-full hover:bg-gray-200 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistoryItem(item.id);
                      }}
                    >
                      <MdClose className="text-gray-500 text-sm" />
                    </button>
                  </div>
                ))}
                
                {/* Infinite scroll trigger element */}
                {hasMore && (
                  <div 
                    ref={loadMoreRef}
                    className="p-2 text-center"
                  >
                    {isLoadingMore ? (
                      <div className="text-gray-500 text-sm">Loading more...</div>
                    ) : (
                      <div className="h-1"></div>
                    )}
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && searchHistory.length > 0 && (
                  <div className="p-2 text-center text-gray-400 text-xs border-t">
                    No more history
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 md:gap-3">
          <IoSearch className="text-gray-500 text-xl md:text-2xl" />
          <Input
            placeholder="Search for any image..."
            className="w-full md:w-[28rem] text-base md:text-lg"
            disableUnderline
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            sx={{
              fontSize: { xs: "1rem", md: "1.125rem" },
              "& input": {
                fontSize: { xs: "1rem", md: "1.125rem" },
              },
            }}
          />
          <div
            className="relative"
            onMouseEnter={handleHistoryHover}
            onMouseLeave={handleHistoryLeave}
          >
            <div className="bg-gray-100 rounded-full p-1.5 md:p-2 cursor-pointer hover:bg-gray-200 transition-colors">
              <MdHistory className="text-gray-500 text-base md:text-lg" />
            </div>
            {/* Invisible bridge to connect icon with dropdown */}
            {showHistory && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-transparent"></div>
            )}
          </div>
          <div
            className="bg-blue-500 rounded-full p-1.5 md:p-2 cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={handleSearch}
          >
            <MdNorth className="text-white text-base md:text-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBox;
