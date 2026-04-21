export interface Config {
  openai: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  dashscope: {
    apiKey: string;
    model: string;
    baseUrl: string;
  };
  pexels: {
    apiKey: string;
  };
  unsplash: {
    accessKey: string;
    secretKey: string;
  };
  app: {
    name: string;
    description: string;
  };
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config: Config = {
    openai: {
      baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || "",
      model: process.env.OPENAI_COMPATIBLE_MODEL || "gpt-4o",
    },
    dashscope: {
      apiKey: process.env.DASHSCOPE_API_KEY || "",
      model: process.env.DASHSCOPE_MULTIMODAL_EMBEDDING_MODEL || "multimodal-embedding-v1",
      baseUrl: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/api/v1",
    },
    pexels: {
      apiKey: process.env.PEXELS_API_KEY || "",
    },
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY || "",
      secretKey: process.env.UNSPLASH_SECRET_KEY || "",
    },
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME || "PicFinder",
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "AI智能图片搜索",
    },
  };

  cachedConfig = config;
  return config;
}

export function validateConfig(): { valid: boolean; missing: string[] } {
  const config = getConfig();
  const missing: string[] = [];

  if (!config.openai.apiKey) {
    missing.push("OPENAI_COMPATIBLE_API_KEY");
  }

  if (!config.dashscope.apiKey) {
    missing.push("DASHSCOPE_API_KEY");
  }

  if (!config.pexels.apiKey) {
    missing.push("PEXELS_API_KEY");
  }

  if (!config.unsplash.accessKey) {
    missing.push("UNSPLASH_ACCESS_KEY");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
