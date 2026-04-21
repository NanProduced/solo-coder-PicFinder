"use client";

import * as React from "react";
import { SearchInput } from "@/components/search-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { MasonryGrid } from "@/components/masonry-grid";
import { LoadingState } from "@/components/loading-state";
import { EmptyState, NoResultsState } from "@/components/empty-state";
import {
  ErrorState,
  ConfigErrorState,
  SimilarityErrorState,
} from "@/components/error-state";
import { ImageResult, cn } from "@/lib/utils";
import { Sparkles, Download, Info, ExternalLink, AlertTriangle } from "lucide-react";

export interface SearchResponse {
  query: string;
  parsedQuery: {
    originalQuery: string;
    searchKeywords: string[];
    colorPreferences?: string[];
    stylePreferences?: string[];
    orientation?: string;
    enhancedDescription: string;
  };
  totalResults: number;
  images: ImageResult[];
  sources: {
    pexels: number;
    unsplash: number;
  };
}

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: SearchResponse }
  | {
      status: "similarity-error";
      error: string;
      rawImages: ImageResult[];
      showRawImages: boolean;
    }
  | { status: "error"; error: string; missing?: string[] }
  | { status: "no-results"; query: string };

export default function Home() {
  const [state, setState] = React.useState<AppState>({ status: "idle" });
  const [lastQuery, setLastQuery] = React.useState<string>("");

  const handleSearch = React.useCallback(async (query: string) => {
    setLastQuery(query);
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          options: {
            maxResults: 10,
            minSimilarity: 0.4,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 500 && errorData.errorType === "similarity") {
          setState({
            status: "similarity-error",
            error: errorData.message || "AI 相似度筛选失败",
            rawImages: errorData.rawImages || [],
            showRawImages: false,
          });
          return;
        }

        if (response.status === 500 && errorData.missing) {
          setState({
            status: "error",
            error: errorData.message || "Missing configuration",
            missing: errorData.missing,
          });
          return;
        }

        throw new Error(errorData.message || `Request failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (data.totalResults === 0 || data.images.length === 0) {
        setState({ status: "no-results", query });
      } else {
        setState({ status: "success", data });
      }
    } catch (error) {
      console.error("Search error:", error);
      setState({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  }, []);

  const handleShowRawImages = React.useCallback(() => {
    if (state.status === "similarity-error") {
      setState({
        ...state,
        showRawImages: true,
      });
    }
  }, [state]);

  const handleRetry = React.useCallback(() => {
    if (lastQuery) {
      handleSearch(lastQuery);
    }
  }, [lastQuery, handleSearch]);

  const handleDownload = React.useCallback(async (image: ImageResult) => {
    try {
      const filename = `${image.author.name} - ${
        image.title || image.id
      }.jpg`.replace(/[<>:"/\\|?*]/g, "_");

      const downloadUrl = `/api/download?url=${encodeURIComponent(
        image.downloadUrl
      )}&filename=${encodeURIComponent(filename)}&source=${image.source}`;

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        window.open(image.downloadUrl, "_blank", "noopener noreferrer");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(image.downloadUrl, "_blank", "noopener noreferrer");
    }
  }, []);

  const getRawImagesForDisplay = React.useMemo(() => {
    if (state.status === "similarity-error" && state.showRawImages) {
      return state.rawImages.slice(0, 10);
    }
    return [];
  }, [state]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 blur-md opacity-50" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                PicFinder
              </h1>
              <p className="text-xs text-muted-foreground">
                AI智能图片搜索
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div
          className={cn(
            "transition-all duration-500",
            state.status !== "idle"
              ? "mb-8"
              : "mx-auto mb-12 max-w-2xl pt-16"
          )}
        >
          {state.status === "idle" && (
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                用自然语言描述
                <br className="hidden sm:block" />
                你想要的图片
              </h2>
              <p className="mt-4 text-muted-foreground">
                AI 会并行搜索多个平台，并用多模态模型筛选最相关的高质量图片
              </p>
            </div>
          )}

          <SearchInput
            onSearch={handleSearch}
            isLoading={state.status === "loading"}
          />

          {((state.status === "success" ||
            state.status === "no-results" ||
            (state.status === "similarity-error" && state.showRawImages)) && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>搜索</span>
                <span className="font-medium text-foreground">
                  "{lastQuery}"
                </span>
                {state.status === "success" && (
                  <span>
                    · 找到{" "}
                    <span className="font-medium text-foreground">
                      {state.data.totalResults}
                    </span>{" "}
                    张图片
                  </span>
                )}
                {state.status === "similarity-error" && state.showRawImages && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    · 显示未经 AI 筛选的原始结果
                  </span>
                )}
              </div>
              {state.status === "success" && (
                <div className="hidden items-center gap-4 sm:flex">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Pexels: {state.data.sources.pexels}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Unsplash: {state.data.sources.unsplash}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[400px]">
          {state.status === "idle" && <EmptyState />}

          {state.status === "loading" && <LoadingState />}

          {state.status === "success" && (
            <MasonryGrid images={state.data.images} onDownload={handleDownload} />
          )}

          {state.status === "similarity-error" && !state.showRawImages && (
            <SimilarityErrorState
              message={state.error}
              rawImagesCount={state.rawImages.length}
              onRetry={handleRetry}
              onShowRawImages={handleShowRawImages}
            />
          )}

          {state.status === "similarity-error" && state.showRawImages && (
            <div>
              <div className="mb-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ 当前显示的是未经 AI 智能筛选的原始结果
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      多模态 Embedding 服务暂时不可用，这些结果可能包含不相关的图片。
                    </p>
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={handleRetry}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        重试 AI 筛选
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <MasonryGrid images={getRawImagesForDisplay} onDownload={handleDownload} />
            </div>
          )}

          {state.status === "no-results" && (
            <NoResultsState query={state.query} onRetry={handleRetry} />
          )}

          {state.status === "error" &&
            state.missing &&
            state.missing.length > 0 && (
              <ConfigErrorState missingConfigs={state.missing} />
            )}

          {state.status === "error" &&
            (!state.missing || state.missing.length === 0) && (
              <ErrorState
                message={state.error}
                onRetry={handleRetry}
              />
            )}
        </div>
      </main>

      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-xl mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                图片来源：
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                >
                  Unsplash
                  <ExternalLink className="h-3 w-3" />
                </a>
                、
                <a
                  href="https://pexels.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                >
                  Pexels
                  <ExternalLink className="h-3 w-3" />
                </a>
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                点击图片下载
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
