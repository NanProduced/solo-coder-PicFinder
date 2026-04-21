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

/**
 * 基于 source + id 的去重，最稳定可靠的方式
 * 不会误删正常结果
 */
export function deduplicateImagesBySourceId(images: ImageResult[]): ImageResult[] {
  const seenIds = new Set<string>();
  const uniqueImages: ImageResult[] = [];

  for (const image of images) {
    const uniqueKey = `${image.source}-${image.id}`;

    if (!seenIds.has(uniqueKey)) {
      seenIds.add(uniqueKey);
      uniqueImages.push(image);
    }
  }

  return uniqueImages;
}

/**
 * 基于 URL 规范化的去重
 * 作为 source+id 去重的备选方案
 */
export function deduplicateImagesByUrl(images: ImageResult[]): ImageResult[] {
  const seenUrls = new Set<string>();
  const uniqueImages: ImageResult[] = [];

  for (const image of images) {
    const normalizedUrl = normalizeImageUrl(image.url);

    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      uniqueImages.push(image);
    }
  }

  return uniqueImages;
}

/**
 * 规范化图片 URL，去除查询参数等差异
 */
function normalizeImageUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const cleanPathname = urlObj.pathname
      .replace(/\/\d+x\d+\//g, "/")
      .replace(/@\d+x\./g, "@.");
    return `${urlObj.hostname}${cleanPathname}`;
  } catch {
    return url.split("?")[0];
  }
}

/**
 * 旧的基于分辨率的去重（已弃用）
 * 保留用于兼容性参考，但不应在新代码中使用
 * @deprecated 使用 deduplicateImagesBySourceId 或 deduplicateImagesByUrl 替代
 */
export function deduplicateImages(
  images: ImageResult[],
  threshold: number = 0.95
): ImageResult[] {
  console.warn("deduplicateImages is deprecated. Use deduplicateImagesBySourceId instead.");
  return deduplicateImagesBySourceId(images);
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
