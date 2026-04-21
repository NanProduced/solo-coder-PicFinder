import axios from "axios";
import { getConfig } from "@/lib/config";
import { ImageResult } from "@/lib/utils";

interface UnsplashPhoto {
  id: string;
  created_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  likes: number;
  liked_by_user: boolean;
  description: string | null;
  alt_description: string | null;
  user: {
    id: string;
    username: string;
    name: string;
    portfolio_url: string | null;
    bio: string | null;
    location: string | null;
    total_likes: number;
    total_photos: number;
    total_collections: number;
    instagram_username: string | null;
    twitter_username: string | null;
    links: {
      self: string;
      html: string;
      photos: string;
      likes: string;
      portfolio: string | null;
      following: string;
      followers: string;
    };
    profile_image: {
      small: string;
      medium: string;
      large: string;
    };
  };
  current_user_collections: unknown[];
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function searchUnsplash(
  query: string,
  options: {
    perPage?: number;
    orientation?: "landscape" | "portrait" | "squarish";
  } = {}
): Promise<ImageResult[]> {
  const config = getConfig();

  if (!config.unsplash.accessKey) {
    console.warn("Unsplash API key not configured");
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

    const response = await axios.get<UnsplashSearchResponse>(
      "https://api.unsplash.com/search/photos",
      {
        params,
        headers: {
          Authorization: `Client-ID ${config.unsplash.accessKey}`,
        },
        timeout: 10000,
      }
    );

    return response.data.results.map((photo) => ({
      id: `unsplash-${photo.id}`,
      source: "unsplash" as const,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      width: photo.width,
      height: photo.height,
      aspectRatio: photo.width / photo.height,
      author: {
        name: photo.user.name || photo.user.username,
        url: photo.user.links.html,
        avatar: photo.user.profile_image.small,
      },
      title: photo.alt_description || photo.description || undefined,
      description: photo.description || photo.alt_description || undefined,
      downloadUrl: photo.urls.full,
      pageUrl: photo.links.html,
    }));
  } catch (error) {
    console.error("Unsplash search failed:", error);
    return [];
  }
}

export async function searchUnsplashWithMultipleKeywords(
  keywords: string[],
  options: {
    perPage?: number;
    orientation?: "landscape" | "portrait" | "squarish";
  } = {}
): Promise<ImageResult[]> {
  const results: ImageResult[] = [];
  const seenIds = new Set<string>();

  const searches = keywords.map((keyword) =>
    searchUnsplash(keyword, options)
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
