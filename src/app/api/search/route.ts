import { NextRequest, NextResponse } from "next/server";
import { searchImages, SearchOptions, SimilarityError } from "@/lib/services/search-service";
import { validateConfig } from "@/lib/config";
import { ImageResult } from "@/lib/utils";

export const maxDuration = 60;

interface SimilarityErrorResponse {
  error: string;
  message: string;
  errorType: "similarity";
  rawImages?: ImageResult[];
}

export async function POST(request: NextRequest) {
  try {
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          error: "Missing required configuration",
          missing: configValidation.missing,
          message:
            "Please configure the required API keys in your .env file. Check .env.example for reference.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query, options } = body as {
      query: string;
      options?: SearchOptions;
    };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Invalid query",
          message: "Query must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    const result = await searchImages(query.trim(), options);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);

    if (error instanceof SimilarityError) {
      const response: SimilarityErrorResponse = {
        error: "Similarity calculation failed",
        message: error.message,
        errorType: "similarity",
        rawImages: error.rawImages,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: "Search failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "PicFinder Search API",
      endpoints: {
        "POST /api/search": {
          description: "Search for images using AI",
          request: {
            query: "string (required)",
            options: {
              perSource: "number (optional, default: 15)",
              minSimilarity: "number (optional, default: 0.4)",
              minResolution: "number (optional, default: 800)",
              maxResults: "number (optional, default: 10)",
              orientation: "string (optional: landscape, portrait, square)",
            },
          },
        },
      },
    },
    { status: 200 }
  );
}
