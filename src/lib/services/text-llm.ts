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

const SYSTEM_PROMPT = `你是一个专业的图片搜索助手。用户会用自然语言描述他们想要的图片，你需要分析并生成更适合图片搜索引擎的关键词。

请分析用户的查询并返回以下信息（JSON格式）：
- searchKeywords: 一组适合搜索的关键词短语（3-5个）
- colorPreferences: 用户可能喜欢的颜色（如果有提到）
- stylePreferences: 用户提到的风格类型（如极简、复古、现代等）
- orientation: 图片方向（landscape横向, portrait纵向, square方形，如果没有指定则不返回）
- enhancedDescription: 优化后的图片描述，更适合多模态embedding模型理解

注意：
1. 关键词要具体且适合图片搜索
2. 如果用户用中文，请用中文关键词
3. 保持简洁，避免冗余
4. 不要添加用户没有提到的信息

示例输出：
{
  "searchKeywords": ["阳光明媚的海滩", "热带海岛风景", "白色沙滩", "蓝色海水", "度假胜地"],
  "colorPreferences": ["蓝色", "白色", "绿色"],
  "stylePreferences": ["自然风景"],
  "orientation": "landscape",
  "enhancedDescription": "阳光明媚的热带海滩，白色的沙滩，清澈的蓝色海水，棕榈树，度假胜地"
}`;

export async function parseUserQuery(query: string): Promise<ParsedQuery> {
  const config = getConfig();

  const openai = new OpenAI({
    baseURL: config.openai.baseUrl,
    apiKey: config.openai.apiKey,
  });

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `用户查询：${query}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("LLM返回内容为空");
  }

  try {
    const parsed = JSON.parse(content) as ParsedQuery;
    parsed.originalQuery = query;

    if (!parsed.searchKeywords || parsed.searchKeywords.length === 0) {
      parsed.searchKeywords = [query];
    }

    if (!parsed.enhancedDescription) {
      parsed.enhancedDescription = query;
    }

    return parsed;
  } catch (e) {
    console.error("解析LLM响应失败:", e);
    return {
      originalQuery: query,
      searchKeywords: [query],
      enhancedDescription: query,
    };
  }
}
