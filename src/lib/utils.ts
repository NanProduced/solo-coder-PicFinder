import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function calculateCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

export function deduplicateImages(
  images: ImageResult[],
  threshold: number = 0.95
): ImageResult[] {
  const uniqueImages: ImageResult[] = [];
  const seenHashes = new Set<string>();

  for (const image of images) {
    const hashKey = `${image.width}-${image.height}-${Math.round(image.aspectRatio * 100)}`;

    if (!seenHashes.has(hashKey)) {
      seenHashes.add(hashKey);
      uniqueImages.push(image);
    }
  }

  return uniqueImages;
}

export interface ImageResult {
  id: string;
  source: "pexels" | "unsplash";
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  author: {
    name: string;
    url?: string;
    avatar?: string;
  };
  title?: string;
  description?: string;
  similarity?: number;
  downloadUrl: string;
  pageUrl: string;
}
