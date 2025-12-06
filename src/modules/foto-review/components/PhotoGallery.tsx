/**
 * Photo Gallery Component
 * Displays DR installation photos in a responsive grid
 * Supports click-to-enlarge lightbox view
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PhotoGalleryProps } from '../types';

export function PhotoGallery({ photos, dr_number }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
  };

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No photos available for {dr_number}</p>
          <p className="text-gray-400 text-sm mt-2">Photos will appear here once uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all group"
            onClick={() => openLightbox(index)}
            title={`${photo.stepLabel}\n${photo.filename}\n${photo.timestamp ? new Date(photo.timestamp).toLocaleString() : 'No timestamp'}`}
          >
            <Image
              src={photo.url}
              alt={photo.stepLabel}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">{photo.stepLabel}</p>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 pointer-events-none">
              <div className="text-white text-center space-y-1">
                <p className="text-sm font-semibold">{photo.stepLabel}</p>
                <p className="text-xs text-gray-300 break-all">{photo.filename}</p>
                {photo.timestamp && (
                  <p className="text-xs text-gray-400">
                    {new Date(photo.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          {selectedPhotoIndex > 0 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={48} />
            </button>
          )}

          {/* Next Button */}
          {selectedPhotoIndex < photos.length - 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={48} />
            </button>
          )}

          {/* Photo Display */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].stepLabel}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Photo Info */}
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-semibold">{photos[selectedPhotoIndex].stepLabel}</p>
              <p className="text-sm text-gray-300 mt-1">
                {selectedPhotoIndex + 1} of {photos.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {photos[selectedPhotoIndex].filename}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
