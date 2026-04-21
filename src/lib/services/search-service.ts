import { ParsedQuery, parseUserQuery } from "./text-llm";
import { searchPexelsWithMultipleKeywords } from "./pexels";
import { searchUnsplashWithMultipleKeywords } from "./unsplash";
import { calculateImageSimilarities } from "./dashscope-multimodal";
import { ImageResult, deduplicateImages } from "@/lib/utils";

export interface SearchOptions {
  perSource?: number;
  minSimilarity?: number;
  minResolution?: number;
  maxResults?: number;
  orientation?: "landscape" | "portrait" | "square";
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
}

const DEFAULT_OPTIONS: SearchOptions = {
  perSource: 15,
  minSimilarity: 0.4,
  minResolution: 800,
  maxResults: 10,
};

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
    };
  }

  const deduplicated = deduplicateImages(filteredByResolution);

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
    console.error("相似度计算失败，返回原始结果:", error);

    deduplicated.sort((a, b) => {
      const resolutionA = a.width * a.height;
      const resolutionB = b.width * b.height;
      return resolutionB - resolutionA;
    });

    const finalImages = deduplicated.slice(0, opts.maxResults);

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
  }
}
