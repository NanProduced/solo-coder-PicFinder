"use client";

import * as React from "react";
import { ImageCard } from "@/components/image-card";
import { ImageResult, cn } from "@/lib/utils";

interface MasonryGridProps {
  images: ImageResult[];
  onDownload?: (image: ImageResult) => void;
  columns?: number;
  gap?: number;
  className?: string;
}

/**
 * 智能瀑布流布局组件
 * 解决单列过长问题的核心改进：
 * 1. 预排序：将高/矮图片交错排列
 * 2. 更准确的高度计算
 * 3. 智能分配策略
 */
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
    if (columns === 0 || images.length === 0) {
      return [];
    }

    const sortedImages = sortImagesForBalancedLayout([...images], columns);

    return distributeImagesOptimally(sortedImages, columns);
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
                priority={imageIndex < 2 && columnIndex === 0}
                onDownload={onDownload}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 对图片进行排序，使布局更平衡
 * 策略：
 * 1. 按高度（aspectRatio）降序排列
 * 2. 将高的图片和矮的图片交错放置
 */
function sortImagesForBalancedLayout(
  images: ImageResult[],
  columns: number
): ImageResult[] {
  if (images.length <= columns) {
    return images;
  }

  const sortedByHeight = [...images].sort((a, b) => {
    const heightA = a.aspectRatio;
    const heightB = b.aspectRatio;
    return heightB - heightA;
  });

  const half = Math.ceil(sortedByHeight.length / 2);
  const tallerImages = sortedByHeight.slice(0, half);
  const shorterImages = sortedByHeight.slice(half);

  const interleaved: ImageResult[] = [];
  for (let i = 0; i < Math.max(tallerImages.length, shorterImages.length); i++) {
    if (i < tallerImages.length) {
      interleaved.push(tallerImages[i]);
    }
    if (i < shorterImages.length) {
      interleaved.push(shorterImages[i]);
    }
  }

  return interleaved;
}

/**
 * 智能分配图片到各列，使各列高度更均衡
 * 改进：
 * 1. 前 N 张（N = 列数）最高的图片分别放到不同列
 * 2. 后续图片使用加权算法选择最佳列
 */
function distributeImagesOptimally(
  images: ImageResult[],
  columns: number
): ImageResult[][] {
  const cols: ImageResult[][] = Array.from({ length: columns }, () => []);
  const columnHeights = new Array(columns).fill(0);

  const sortedImages = [...images].sort((a, b) => b.aspectRatio - a.aspectRatio);

  for (let i = 0; i < sortedImages.length; i++) {
    const image = sortedImages[i];
    const imageHeight = image.aspectRatio;

    let targetColumn: number;

    if (i < columns) {
      targetColumn = i;
    } else {
      targetColumn = findBestColumnForImage(
        columnHeights,
        imageHeight,
        columns
      );
    }

    cols[targetColumn].push(image);
    columnHeights[targetColumn] += imageHeight;
  }

  return cols;
}

/**
 * 为图片找到最佳列
 * 考虑因素：
 * 1. 当前列高度（优先选择矮的列）
 * 2. 图片高度（高图片更影响平衡）
 * 3. 与其他列的高度差
 */
function findBestColumnForImage(
  columnHeights: number[],
  imageHeight: number,
  columns: number
): number {
  const minHeight = Math.min(...columnHeights);
  const maxHeight = Math.max(...columnHeights);
  const heightRange = maxHeight - minHeight;

  if (heightRange < 0.5) {
    return columnHeights.indexOf(minHeight);
  }

  const scores = columnHeights.map((height, index) => {
    const futureHeight = height + imageHeight;
    let maxOtherHeight = -Infinity;

    for (let i = 0; i < columns; i++) {
      if (i !== index) {
        maxOtherHeight = Math.max(maxOtherHeight, columnHeights[i]);
      }
    }

    const penalty = Math.max(0, futureHeight - maxOtherHeight) * 2;
    const score = height - penalty;

    return { index, score, futureHeight };
  });

  scores.sort((a, b) => a.score - b.score);

  return scores[0].index;
}
