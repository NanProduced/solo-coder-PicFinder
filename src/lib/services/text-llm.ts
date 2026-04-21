import OpenAI from "openai";
import { getConfig } from "@/lib/config";

export interface ParsedQuery {
  originalQuery: string;
  searchKeywords: string[];
  colorPreferences?: string[];
  stylePreferences?: string[];
  orientation?: "landscape" | "portrait" | "square";
  enhancedDescription: string;
}

function getSystemPrompt(): string {
  const lines = [
    "You are a professional image search query optimizer. Analyze the user's query and generate optimized search terms for stock photo websites like Unsplash and Pexels.",
    "",
    "CRITICAL REQUIREMENT: ALL keywords and descriptions MUST be in ENGLISH, even if the user's query is in Chinese or other languages.",
    "",
    "Analyze the user's query and return the following in JSON format:",
    "- searchKeywords: An array of 3-5 optimized English keyword phrases suitable for stock photo searches",
    "- colorPreferences: Array of preferred colors (if mentioned)",
    "- stylePreferences: Array of style types mentioned (minimal, vintage, modern, etc.)",
    "- orientation: 'landscape', 'portrait', or 'square' (optional, only if explicitly mentioned)",
    "- enhancedDescription: An enhanced English description of the image, optimized for multimodal embedding models",
    "",
    "Guidelines for generating keywords:",
    "1. Translate non-English queries to English",
    "2. Use stock photo friendly terms (e.g., 'beautiful sunset' instead of 'nice evening')",
    "3. Include descriptive adjectives and context",
    "4. Avoid overly generic terms; be specific when possible",
    "5. Think about what professional photographers would tag their photos",
    "",
    "Example input: '阳光下的海滩'",
    "Example output:",
    "{",
    '  "searchKeywords": ["sunny tropical beach", "white sand beach ocean", "palm trees at sunset", "coastal landscape summer", "beach vacation paradise"],',
    '  "colorPreferences": ["blue", "white", "green"],',
    '  "stylePreferences": ["nature landscape"],',
    '  "orientation": "landscape",',
    '  "enhancedDescription": "A sunny tropical beach with white sand, crystal clear blue ocean water, swaying palm trees, and warm golden sunlight"',
    "}",
    "",
    "Return ONLY valid JSON. Do not include any explanations, markdown formatting, or additional text.",
  ];
  return lines.join("\n");
}

function extractJsonFromContent(content: string): string {
  let jsonStr = content.trim();

  if (jsonStr.startsWith("<think>")) {
    const thinkEndIndex = jsonStr.indexOf("</think>");
    if (thinkEndIndex !== -1) {
      jsonStr = jsonStr.substring(thinkEndIndex + "</think>".length).trim();
    }
  }

  const jsonStartIndex = jsonStr.indexOf("{");
  const jsonEndIndex = jsonStr.lastIndexOf("}");

  if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
    jsonStr = jsonStr.substring(jsonStartIndex, jsonEndIndex + 1);
  }

  return jsonStr;
}

function tryParseJson(jsonStr: string): ParsedQuery | null {
  try {
    return JSON.parse(jsonStr) as ParsedQuery;
  } catch {
    return null;
  }
}

function getFallbackKeywords(query: string): string[] {
  const simpleTranslations: Record<string, string[]> = {
    "海滩": ["beach", "coast", "sea"],
    "山": ["mountain", "peak", "nature"],
    "城市": ["city", "urban", "architecture"],
    "猫": ["cat", "pet", "animal"],
    "狗": ["dog", "pet", "animal"],
    "花": ["flower", "nature", "bloom"],
    "树": ["tree", "forest", "nature"],
    "人": ["people", "portrait", "human"],
    "美食": ["food", "delicious", "cooking"],
    "建筑": ["architecture", "building", "design"],
    "日落": ["sunset", "evening", "golden hour"],
    "日出": ["sunrise", "morning", "dawn"],
    "汽车": ["car", "automobile", "vehicle"],
    "天空": ["sky", "clouds", "blue"],
    "海洋": ["ocean", "sea", "water"],
    "森林": ["forest", "woods", "nature"],
    "咖啡": ["coffee", "cafe", "drink"],
    "书": ["book", "reading", "library"],
    "音乐": ["music", "concert", "instrument"],
    "运动": ["sports", "fitness", "exercise"],
  };

  for (const [cn, en] of Object.entries(simpleTranslations)) {
    if (query.includes(cn)) {
      return en;
    }
  }

  const hasChinese = /[\u4e00-\u9fa5]/.test(query);
  if (hasChinese) {
    return ["nature", "landscape", "background"];
  }

  return [query.toLowerCase().trim()];
}

export async function parseUserQuery(query: string): Promise<ParsedQuery> {
  const config = getConfig();

  const openai = new OpenAI({
    baseURL: config.openai.baseUrl,
    apiKey: config.openai.apiKey,
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: `User query: ${query}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("LLM返回内容为空");
    }

    console.log("LLM原始响应:", content);

    const jsonStr = extractJsonFromContent(content);
    console.log("提取的JSON:", jsonStr);

    const parsed = tryParseJson(jsonStr);

    if (parsed) {
      parsed.originalQuery = query;

      if (!parsed.searchKeywords || parsed.searchKeywords.length === 0) {
        parsed.searchKeywords = getFallbackKeywords(query);
      }

      if (!parsed.enhancedDescription) {
        parsed.enhancedDescription = parsed.searchKeywords[0] || query;
      }

      return parsed;
    }

    console.error("解析LLM响应失败，原始内容:", content);
  } catch (error) {
    console.error("LLM解析失败，使用降级方案:", error);
  }

  const fallbackKeywords = getFallbackKeywords(query);
  return {
    originalQuery: query,
    searchKeywords: fallbackKeywords,
    enhancedDescription: fallbackKeywords.join(" "),
  };
}
