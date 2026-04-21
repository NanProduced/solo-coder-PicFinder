"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "出错了",
  message = "搜索过程中遇到了一些问题，请稍后再试。",
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "py-16",
        className
      )}
    >
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-destructive/10 blur-xl opacity-50" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <div className="mt-6 text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{message}</p>

        {errorMessage && (
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? "隐藏详细信息" : "显示详细信息"}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-xs font-mono text-destructive/80 break-all">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "mt-8 flex items-center gap-2",
            "px-6 py-2.5",
            "rounded-lg",
            "bg-primary",
            "text-primary-foreground",
            "text-sm font-medium",
            "transition-all",
            "hover:bg-primary/90",
            "active:scale-[0.98]",
            "focus-ring"
          )}
        >
          <RefreshCw className="h-4 w-4" />
          重试
        </button>
      )}
    </div>
  );
}

export function ConfigErrorState({
  missingConfigs,
}: {
  missingConfigs: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-destructive/10 blur-xl opacity-50" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <div className="mt-6 text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground">缺少必要配置</h3>
        <p className="text-muted-foreground">
          请配置以下 API 密钥后再使用：
        </p>

        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
          <ul className="space-y-2 text-left">
            {missingConfigs.map((config) => (
              <li key={config} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span className="font-mono text-xs">{config}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-muted-foreground/70">
          请在 <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">.env</code> 文件中配置这些环境变量。
          参考 <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">.env.example</code> 获取配置模板。
        </p>
      </div>
    </div>
  );
}
