import { ParsedQuery, parseUserQuery } from "./text-llm";
import { searchPexelsWithMultipleKeywords } from "./pexels";
import { searchUnsplashWithMultipleKeywords } from "./unsplash";
import { calculateImageSimilarities } from "./dashscope-multimodal";
import { ImageResult, deduplicateImagesBySourceId } from "@/lib/utils";

export interface SearchOptions {
  perSource?: number;
  minSimilarity?: number;
  minResolution?: number;
  maxResults?: number;
  orientation?: "landscape" | "portrait" | "square";
}

export interface SearchError {
  type: "similarity" | "sources" | "config" | "unknown";
  message: string;
  details?: string;
  rawImages?: ImageResult[];
}

export interface SearchResult {
  query: string;
  parsedQuery: ParsedQuery;
  totalResults: number;
  images: ImageResult[];
  sources: {
    pexels: number;
    unsplash: number;
  };
  error?: SearchError;
}

const DEFAULT_OPTIONS: SearchOptions = {
  perSource: 15,
  minSimilarity: 0.4,
  minResolution: 800,
  maxResults: 10,
};

export class SimilarityError extends Error {
  type: "similarity" = "similarity";
  rawImages: ImageResult[];

  constructor(message: string, rawImages: ImageResult[]) {
    super(message);
    this.name = "SimilarityError";
    this.rawImages = rawImages;
  }
}

export async function searchImages(
  userQuery: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const parsedQuery = await parseUserQuery(userQuery);

  const searchKeywords = parsedQuery.searchKeywords.slice(0, 3);

  const [pexelsImages, unsplashImages] = await Promise.all([
    searchPexelsWithMultipleKeywords(searchKeywords, {
      perPage: opts.perSource,
      orientation: parsedQuery.orientation,
    }).catch((error) => {
      console.error("Pexels搜索失败:", error);
      return [] as ImageResult[];
    }),
    searchUnsplashWithMultipleKeywords(searchKeywords, {
      perPage: opts.perSource,
      orientation: parsedQuery.orientation as "landscape" | "portrait" | "squarish" | undefined,
    }).catch((error) => {
      console.error("Unsplash搜索失败:", error);
      return [] as ImageResult[];
    }),
  ]);

  const allImages = [...pexelsImages, ...unsplashImages];

  if (allImages.length === 0) {
    return {
      query: userQuery,
      parsedQuery,
      totalResults: 0,
      images: [],
      sources: {
        pexels: 0,
        unsplash: 0,
      },
      error: {
        type: "sources",
        message: "所有图片源搜索失败",
        details: "请检查您的 Pexels 和 Unsplash API 配置",
      },
    };
  }

  const filteredByResolution = allImages.filter(
    (img) => img.width >= opts.minResolution! && img.height >= opts.minResolution!
  );

  if (filteredByResolution.length === 0) {
    return {
      query: userQuery,
      parsedQuery,
      totalResults: 0,
      images: [],
      sources: {
        pexels: 0,
        unsplash: 0,
      },
      error: {
        type: "unknown",
        message: "没有找到足够高分辨率的图片",
        details: `所有搜索结果的分辨率都低于 ${opts.minResolution}px 阈值`,
        rawImages: allImages,
      },
    };
  }

  const deduplicated = deduplicateImagesBySourceId(filteredByResolution);

  const imageUrls = deduplicated.map((img) => img.thumbnailUrl);

  try {
    const similarityResults = await calculateImageSimilarities(
      parsedQuery.enhancedDescription || userQuery,
      imageUrls,
      {
        similarityThreshold: opts.minSimilarity,
      }
    );

    const similarityMap = new Map(
      similarityResults.map((r) => [r.imageUrl, r.similarity])
    );

    const imagesWithSimilarity = deduplicated
      .map((img) => ({
        ...img,
        similarity: similarityMap.get(img.thumbnailUrl) ?? 0,
      }))
      .filter((img) => img.similarity >= opts.minSimilarity!);

    imagesWithSimilarity.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));

    const finalImages = imagesWithSimilarity.slice(0, opts.maxResults);

    return {
      query: userQuery,
      parsedQuery,
      totalResults: finalImages.length,
      images: finalImages,
      sources: {
        pexels: finalImages.filter((i) => i.source === "pexels").length,
        unsplash: finalImages.filter((i) => i.source === "unsplash").length,
      },
    };
  } catch (error) {
    console.error("相似度计算失败:", error);

    const errorMessage = error instanceof Error ? error.message : "未知错误";

    throw new SimilarityError(
      `AI 图片相似度筛选失败: ${errorMessage}`,
      deduplicated
    );
  }
}
