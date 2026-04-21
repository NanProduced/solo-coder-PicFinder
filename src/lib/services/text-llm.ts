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

重要规则：
1. 直接输出JSON，不要输出任何思考过程、解释或额外文字
2. 不要使用markdown代码块标记（```json 或 ```）
3. 直接输出JSON对象本身
4. 如果用户用中文，请用中文关键词
5. 保持简洁，避免冗余
6. 不要添加用户没有提到的信息

示例输出：
{
  "searchKeywords": ["阳光明媚的海滩", "热带海岛风景", "白色沙滩", "蓝色海水", "度假胜地"],
  "colorPreferences": ["蓝色", "白色", "绿色"],
  "stylePreferences": ["自然风景"],
  "orientation": "landscape",
  "enhancedDescription": "阳光明媚的热带海滩，白色的沙滩，清澈的蓝色海水，棕榈树，度假胜地"
}`;

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
      parsed.searchKeywords = [query];
    }

    if (!parsed.enhancedDescription) {
      parsed.enhancedDescription = query;
    }

    return parsed;
  }

  console.error("解析LLM响应失败，原始内容:", content);
  return {
    originalQuery: query,
    searchKeywords: [query],
    enhancedDescription: query,
  };
}
