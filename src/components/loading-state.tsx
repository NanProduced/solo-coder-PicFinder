"use client";

import * as React from "react";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export function LoadingState({
  message = "AI 正在搜索图片...",
  subMessage = "并行搜索 Pexels 和 Unsplash，并用多模态模型筛选最相关的图片",
  className,
}: LoadingStateProps) {
  const [step, setStep] = React.useState(0);

  const steps = [
    { icon: Sparkles, label: "理解你的需求" },
    { icon: ImageIcon, label: "搜索高质量图片" },
    { icon: Sparkles, label: "筛选最相关结果" },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [steps.length]);

  const CurrentIcon = steps[step].icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "py-16",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CurrentIcon className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">{subMessage}</p>
      </div>

      <div className="mt-8 flex items-center gap-6">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isPast = i < step;

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                "transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary"
                  : isPast
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground/40"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive && "animate-pulse"
                )}
              />
              <span className="text-sm">{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: "0ms" }} />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "150ms" }} />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: "300ms" }} />
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "450ms" }} />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-card animate-pulse">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-2 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}
