import axios from "axios";
import { getConfig } from "@/lib/config";
import { calculateCosineSimilarity } from "@/lib/utils";

export interface EmbeddingResult {
  embedding: number[];
  textIndex?: number;
  imageIndex?: number;
}

export interface MultimodalEmbeddingResponse {
  output: {
    embeddings: Array<{
      text_index?: number;
      image_index?: number;
      embedding: number[];
    }>;
  };
  request_id: string;
}

function getMultimodalApiUrl(): string {
  const config = getConfig();
  const baseUrl = config.dashscope.baseUrl || "https://dashscope.aliyuncs.com/api/v1";
  return `${baseUrl}/services/embeddings/multimodal-embedding/multimodal-embedding`;
}

function getDefaultModel(): string {
  const config = getConfig();
  return config.dashscope.model || "qwen3-vl-embedding";
}

export async function getTextEmbedding(
  text: string,
  options: {
    model?: string;
    dimension?: number;
  } = {}
): Promise<number[]> {
  const config = getConfig();

  if (!config.dashscope.apiKey) {
    throw new Error("DASHSCOPE_API_KEY 未配置");
  }

  const model = options.model || getDefaultModel();
  const dimension = options.dimension || 1024;
  const apiUrl = getMultimodalApiUrl();

  const requestBody = {
    model,
    input: {
      contents: [{ text }],
    },
    parameters: {
      dimension,
    },
  };

  try {
    const response = await axios.post<MultimodalEmbeddingResponse>(
      apiUrl,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${config.dashscope.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const embeddings = response.data.output.embeddings;
    if (!embeddings || embeddings.length === 0) {
      throw new Error("未能获取文本embedding");
    }

    return embeddings[0].embedding;
  } catch (error) {
    console.error("获取文本embedding失败:", error);
    if (axios.isAxiosError(error)) {
      console.error("API响应:", error.response?.data);
    }
    throw error;
  }
}

export async function getImageEmbedding(
  imageUrl: string,
  options: {
    model?: string;
    dimension?: number;
  } = {}
): Promise<number[]> {
  const config = getConfig();

  if (!config.dashscope.apiKey) {
    throw new Error("DASHSCOPE_API_KEY 未配置");
  }

  const model = options.model || getDefaultModel();
  const dimension = options.dimension || 1024;
  const apiUrl = getMultimodalApiUrl();

  const requestBody = {
    model,
    input: {
      contents: [{ image: imageUrl }],
    },
    parameters: {
      dimension,
    },
  };

  try {
    const response = await axios.post<MultimodalEmbeddingResponse>(
      apiUrl,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${config.dashscope.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const embeddings = response.data.output.embeddings;
    if (!embeddings || embeddings.length === 0) {
      throw new Error("未能获取图片embedding");
    }

    return embeddings[0].embedding;
  } catch (error) {
    console.error("获取图片embedding失败:", error);
    if (axios.isAxiosError(error)) {
      console.error("API响应:", error.response?.data);
    }
    throw error;
  }
}

export async function batchGetImageEmbeddings(
  imageUrls: string[],
  options: {
    model?: string;
    dimension?: number;
    batchSize?: number;
  } = {}
): Promise<Map<string, number[]>> {
  const model = options.model || getDefaultModel();
  const batchSize = options.batchSize || 5;
  const dimension = options.dimension || 1024;
  const results = new Map<string, number[]>();

  const batches: string[][] = [];
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    batches.push(imageUrls.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const promises = batch.map((url) =>
      getImageEmbedding(url, { model, dimension }).then(
        (embedding) => ({ url, embedding })
      ).catch((error) => {
        console.warn(`获取图片embedding失败: ${url}`, error);
        return null;
      })
    );

    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result) {
        results.set(result.url, result.embedding);
      }
    }
  }

  return results;
}

export interface ImageSimilarityResult {
  imageUrl: string;
  similarity: number;
}

export async function calculateImageSimilarities(
  queryText: string,
  imageUrls: string[],
  options: {
    model?: string;
    dimension?: number;
    similarityThreshold?: number;
  } = {}
): Promise<ImageSimilarityResult[]> {
  const model = options.model || getDefaultModel();
  const dimension = options.dimension || 1024;
  const similarityThreshold = options.similarityThreshold || 0.5;

  const queryEmbedding = await getTextEmbedding(queryText, { model, dimension });

  const imageEmbeddings = await batchGetImageEmbeddings(imageUrls, {
    model,
    dimension,
  });

  const results: ImageSimilarityResult[] = [];

  for (const imageUrl of imageUrls) {
    const imageEmbedding = imageEmbeddings.get(imageUrl);
    if (imageEmbedding) {
      const similarity = calculateCosineSimilarity(queryEmbedding, imageEmbedding);
      if (similarity >= similarityThreshold) {
        results.push({
          imageUrl,
          similarity,
        });
      }
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);

  return results;
}
