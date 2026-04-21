"use client";

import * as React from "react";
import { Image, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "开始搜索图片",
  description = "用自然语言描述你想要的图片，AI 会帮你找到最相关的高质量图片",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "py-16",
        className
      )}
    >
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          {icon || <Image className="h-10 w-10 text-primary/60" />}
        </div>
      </div>

      <div className="mt-6 text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {action && <div className="mt-8">{action}</div>}

      <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">AI 理解需求</p>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">多源搜索</p>
        </div>
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Image className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">智能筛选</p>
        </div>
      </div>
    </div>
  );
}

export function NoResultsState({
  query,
  onRetry,
}: {
  query: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-muted/50 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Search className="h-8 w-8 text-muted-foreground/60" />
        </div>
      </div>

      <div className="mt-6 text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">没有找到相关图片</h3>
        <p className="text-muted-foreground">
          没有找到与 <span className="font-medium text-foreground">"{query}"</span> 相关的图片。
        </p>
        <p className="text-sm text-muted-foreground/70">
          尝试使用更具体的描述，或者换一种方式表达你的需求。
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">试试这些示例：</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <ExampleSuggestion text="阳光明媚的海滩" />
            <ExampleSuggestion text="极简风格的办公空间" />
            <ExampleSuggestion text="城市夜景" />
          </div>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-8 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:bg-primary/90 active:scale-[0.98] focus-ring"
        >
          重新搜索
        </button>
      )}
    </div>
  );
}

function ExampleSuggestion({ text }: { text: string }) {
  return (
    <button className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs transition-all hover:bg-accent">
      {text}
    </button>
  );
}
