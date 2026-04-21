"use client";

import * as React from "react";
import { Download, ExternalLink, Heart } from "lucide-react";
import Image from "next/image";
import { cn, ImageResult, formatFileSize } from "@/lib/utils";

interface ImageCardProps {
  image: ImageResult;
  priority?: boolean;
  onDownload?: (image: ImageResult) => void;
  className?: string;
}

export function ImageCard({
  image,
  priority = false,
  onDownload,
  className,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.(image);
  };

  const sourceColors = {
    unsplash: "bg-green-500",
    pexels: "bg-blue-500",
  };

  const sourceNames = {
    unsplash: "Unsplash",
    pexels: "Pexels",
  };

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-xl",
        "bg-card",
        "border border-border/50",
        "transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5",
        "hover:border-border",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          </div>
        )}

        <Image
          src={image.thumbnailUrl}
          alt={image.description || image.title || `图片 ${image.id}`}
          fill
          priority={priority}
          className={cn(
            "object-cover transition-all duration-500",
            "group-hover:scale-105",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
            "transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          className={cn(
            "absolute top-3 right-3 flex items-center gap-2",
            "transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <button
            onClick={handleDownload}
            className={cn(
              "flex items-center justify-center",
              "h-9 w-9",
              "rounded-lg",
              "bg-white/90 backdrop-blur-sm",
              "text-foreground",
              "transition-all duration-200",
              "hover:bg-white hover:scale-105",
              "active:scale-95",
              "focus-ring"
            )}
            title="下载图片"
          >
            <Download className="h-4 w-4" />
          </button>

          <a
            href={image.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center",
              "h-9 w-9",
              "rounded-lg",
              "bg-white/90 backdrop-blur-sm",
              "text-foreground",
              "transition-all duration-200",
              "hover:bg-white hover:scale-105",
              "active:scale-95",
              "focus-ring"
            )}
            title="查看原图"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div
          className={cn(
            "absolute top-3 left-3 flex items-center gap-2",
            "transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-1.5",
              "px-2 py-1",
              "rounded-full",
              "bg-white/90 backdrop-blur-sm",
              "text-xs font-medium"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", sourceColors[image.source])} />
            <span>{sourceNames[image.source]}</span>
          </div>

          {image.similarity !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1.5",
                "px-2 py-1",
                "rounded-full",
                "bg-white/90 backdrop-blur-sm",
                "text-xs font-medium"
              )}
            >
              <Heart
                className={cn(
                  "h-3 w-3",
                  image.similarity > 0.7 ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
              <span>{Math.round(image.similarity * 100)}%</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-4",
            "transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {image.author && (
            <div className="flex items-center gap-2">
              {image.author.avatar ? (
                <Image
                  src={image.author.avatar}
                  alt={image.author.name}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {image.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="min-w-0">
                {image.author.url ? (
                  <a
                    href={image.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {image.author.name}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-white truncate">
                    {image.author.name}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-white/80">
            <span>
              {image.width} × {image.height}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
