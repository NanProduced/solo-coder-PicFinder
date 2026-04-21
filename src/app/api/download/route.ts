import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const filename = searchParams.get("filename") || "image.jpg";
    const source = searchParams.get("source") || "";

    if (!url) {
      return NextResponse.json(
        {
          error: "Missing URL parameter",
          message: "The 'url' query parameter is required.",
        },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid URL",
          message: "The 'url' parameter is not a valid URL.",
        },
        { status: 400 }
      );
    }

    const allowedDomains = [
      "images.unsplash.com",
      "images.pexels.com",
      "images.unsplash.com",
      "unsplash.com",
      "pexels.com",
    ];

    const imageUrl = new URL(url);
    const isAllowedDomain = allowedDomains.some((domain) =>
      imageUrl.hostname.endsWith(domain)
    );

    if (!isAllowedDomain) {
      return NextResponse.json(
        {
          error: "Domain not allowed",
          message: "The requested domain is not allowed for download.",
        },
        { status: 403 }
      );
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "PicFinder/1.0 (https://github.com)",
      },
      timeout: 30000,
    });

    const contentType =
      response.headers["content-type"] || "application/octet-stream";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", String(response.data.length));
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    headers.set("Cache-Control", "public, max-age=31536000");

    if (source) {
      headers.set("X-Image-Source", source);
    }

    return new NextResponse(response.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download API error:", error);

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return NextResponse.json(
          {
            error: "Download timeout",
            message: "The image download timed out. Please try again.",
          },
          { status: 504 }
        );
      }

      if (error.response) {
        return NextResponse.json(
          {
            error: "Image download failed",
            message: `The image server returned status ${error.response.status}.`,
          },
          { status: error.response.status || 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Download failed",
        message: "An unexpected error occurred while downloading the image.",
      },
      { status: 500 }
    );
  }
}
