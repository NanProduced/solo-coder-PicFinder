"use client";

import * as React from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({
  placeholder = "描述你想找的图片...",
  onSearch,
  isLoading = false,
  className,
}: SearchInputProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
            ) : (
              <Search className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "w-full h-14 pl-12 pr-32",
              "bg-card/80 backdrop-blur-sm",
              "border border-border",
              "rounded-xl",
              "text-base",
              "placeholder:text-muted-foreground/60",
              "transition-all duration-200",
              "hover:bg-card",
              "hover:border-primary/20",
              "focus:bg-card",
              "focus:border-primary/30",
              "focus:ring-4 focus:ring-primary/5",
              "focus:outline-none",
              "disabled:opacity-50",
              "disabled:cursor-not-allowed"
            )}
          />

          <div className="absolute right-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className={cn(
                "flex items-center gap-2",
                "h-10 px-4",
                "rounded-lg",
                "bg-primary",
                "text-primary-foreground",
                "text-sm font-medium",
                "transition-all duration-200",
                "hover:bg-primary/90",
                "active:scale-[0.98]",
                "disabled:opacity-50",
                "disabled:cursor-not-allowed",
                "focus-ring"
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI搜索</span>
              <span className="sm:hidden">搜索</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground/70">
        <span>试试: "阳光明媚的海滩"</span>
        <span>•</span>
        <span>"极简风格的办公空间"</span>
      </div>
    </form>
  );
}
