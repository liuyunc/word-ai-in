export interface OpenAIConfig {
  apiKey: string;
  // 默认指向 GPUStack 模型主机 http://10.20.40.101/v1（HTTP 部署，无 HTTPS 证书）
  baseUrl?: string;
  model?: string; // 默认 使用qwen3-30b-a3b-thinking-2507-fp8
}

export interface ReviewResult {
  rawResponse: string;
}

export async function callOpenAIForReview(
  paragraphText: string,
  config: OpenAIConfig
): Promise<ReviewResult> {
  const prompt = `你是铁路通信和工程规范文档的审校助手。\n现在给你一个中文段落，请完成以下任务：\n1. 找出段落中的错别字和明显用词问题，并给出建议修改词和原因；\n2. 找出段落中的标点使用问题，包括中英文标点混用、重复标点、句末标点缺失等；\n3. 提取段落中出现的规范/标准编号，例如 "TB 10088-2015"、"GB/T 1234-2017" 等。\n\n请严格使用 JSON 格式输出，不要输出任何多余文字。字段定义如下：\n- typos: 数组，每个元素包含 { "original": string, "suggestion": string, "reason": string }；\n- punctuations: 数组，每个元素包含 { "original": string, "suggestion": string, "reason": string }；\n- standards: 字符串数组，列出识别到的规范/标准编号。\n\n待审查的段落内容如下：\n"""${paragraphText}"""`;

  const apiKey = config.apiKey;
  const baseUrl = config.baseUrl || "http://10.20.40.101/v1";
  const model = config.model || "qwen3-30b-a3b-thinking-2507-fp8";

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const url = normalizedBaseUrl.endsWith("/v1")
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API request failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawResponse = data?.choices?.[0]?.message?.content ?? "";

  return { rawResponse };
}
