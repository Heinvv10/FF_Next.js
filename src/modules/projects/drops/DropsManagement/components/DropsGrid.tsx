
import { useState, useEffect, useRef, useCallback } from 'react';
import { DropCard } from './DropCard';
import type { Drop } from '../types/drops.types';

interface DropsGridProps {
  drops: Drop[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
}

export function DropsGrid({ drops, loading = false, hasMore = false, onLoadMore, totalCount }: DropsGridProps) {
  const [visibleItems, setVisibleItems] = useState(30); // Start with 30 items
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when user scrolls to 80% of the content
    if (scrollPercentage > 0.8 && !loading && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadingRef.current || !hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadingRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const handleDropClick = (_drop: Drop) => {
    // Handle drop click if needed
  };

  const displayedDrops = drops.slice(0, visibleItems);

  return (
    <div className="space-y-4">
      {/* Stats and Info */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Showing {displayedDrops.length} of {totalCount || drops.length} drops</span>
        {hasMore && (
          <span className="text-blue-600">Scroll to load more</span>
        )}
      </div>

      {/* Virtual Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto"
      >
        {displayedDrops.map(drop => (
          <DropCard
            key={drop.id}
            drop={drop}
            onDropClick={handleDropClick}
          />
        ))}

        {/* Loading indicator for infinite scroll */}
        {hasMore && (
          <div ref={loadingRef} className="col-span-full text-center py-4">
            {loading && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading more drops...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}