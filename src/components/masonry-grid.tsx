"use client";

import * as React from "react";
import { ImageCard } from "@/components/image-card";
import { ImageResult } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  images: ImageResult[];
  onDownload?: (image: ImageResult) => void;
  columns?: number;
  gap?: number;
  className?: string;
}

export function MasonryGrid({
  images,
  onDownload,
  columns: initialColumns = 3,
  gap = 24,
  className,
}: MasonryGridProps) {
  const [columns, setColumns] = React.useState(initialColumns);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 1024) {
        setColumns(2);
      } else if (width < 1280) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const columnImages = React.useMemo(() => {
    const cols: ImageResult[][] = Array.from({ length: columns }, () => []);
    const columnHeights = new Array(columns).fill(0);

    for (const image of images) {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      cols[shortestColumn].push(image);
      columnHeights[shortestColumn] += image.aspectRatio || 1;
    }

    return cols;
  }, [images, columns]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full",
        "grid",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {columnImages.map((columnImages, columnIndex) => (
        <div
          key={columnIndex}
          className="flex flex-col"
          style={{ gap: `${gap}px` }}
        >
          {columnImages.map((image, imageIndex) => (
            <div
              key={image.id}
              className="animate-fade-in"
              style={{
                animationDelay: `${(columnIndex + imageIndex) * 50}ms`,
              }}
            >
              <ImageCard
                image={image}
                priority={imageIndex < 3}
                onDownload={onDownload}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
