import axios from "axios";
import { getConfig } from "@/lib/config";
import { ImageResult } from "@/lib/utils";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string | null;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page: string;
}

export async function searchPexels(
  query: string,
  options: {
    perPage?: number;
    orientation?: "landscape" | "portrait" | "square";
  } = {}
): Promise<ImageResult[]> {
  const config = getConfig();

  if (!config.pexels.apiKey) {
    console.warn("Pexels API key not configured");
    return [];
  }

  const { perPage = 20, orientation } = options;

  try {
    const params: Record<string, string | number> = {
      query,
      per_page: perPage,
      page: 1,
    };

    if (orientation) {
      params.orientation = orientation;
    }

    const response = await axios.get<PexelsSearchResponse>(
      "https://api.pexels.com/v1/search",
      {
        params,
        headers: {
          Authorization: config.pexels.apiKey,
        },
        timeout: 10000,
      }
    );

    return response.data.photos.map((photo) => ({
      id: `pexels-${photo.id}`,
      source: "pexels" as const,
      url: photo.src.original,
      thumbnailUrl: photo.src.large,
      width: photo.width,
      height: photo.height,
      aspectRatio: photo.width / photo.height,
      author: {
        name: photo.photographer,
        url: photo.photographer_url,
      },
      title: photo.alt || undefined,
      description: photo.alt || undefined,
      downloadUrl: photo.src.original,
      pageUrl: photo.url,
    }));
  } catch (error) {
    console.error("Pexels search failed:", error);
    return [];
  }
}

export async function searchPexelsWithMultipleKeywords(
  keywords: string[],
  options: {
    perPage?: number;
    orientation?: "landscape" | "portrait" | "square";
  } = {}
): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const seenIds = new Set<string>();

  const searches = keywords.map((keyword) =>
    searchPexels(keyword, options)
  );

  const allResults = await Promise.all(searches);

  for (const images of allResults) {
    for (const image of images) {
      if (!seenIds.has(image.id)) {
        seenIds.add(image.id);
        results.push(image);
      }
    }
  }

  return results;
}
