import React, { useState } from "react";
import { callOpenAIForReview, OpenAIConfig } from "../services/openaiClient";

interface ParsedResult {
  typos?: { original: string; suggestion: string; reason: string }[];
  punctuations?: { original: string; suggestion: string; reason: string }[];
  standards?: string[];
}

const App: React.FC = () => {
  const [paragraphText, setParagraphText] = useState<string>("");
  const [combinedResult, setCombinedResult] = useState<string>("");
  const [rawResponse, setRawResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const openaiConfig: OpenAIConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    baseUrl: "https://api.openai.com",
    model: "gpt-4.1-mini",
  };

  const handleGetParagraph = async () => {
    setError("");
    try {
      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        const paragraph = selection.paragraphs.getFirst();
        paragraph.load("text");
        await context.sync();

        const text = paragraph.text?.trim();
        if (!text) {
          setError("当前光标所在段落为空，请把光标放在需要审查的段落。");
          return;
        }

        setParagraphText(text);
        setCombinedResult("");
        setRawResponse("");
      });
    } catch (err) {
      console.error("获取段落失败", err);
      setError("获取段落失败，请确认已在 Word 中选择了文本或将光标置于段落。");
    }
  };

  const buildCombinedResult = (parsed: ParsedResult): string => {
    const parts: string[] = [];

    if (parsed.typos && parsed.typos.length > 0) {
      const typoDesc = parsed.typos
        .map(
          (item, index) =>
            `问题${index + 1}：原文“${item.original}”，建议“${item.suggestion}”，原因：${item.reason}。`
        )
        .join("");
      parts.push(`错别字提示：${typoDesc}`);
    }

    if (parsed.punctuations && parsed.punctuations.length > 0) {
      const punctuationDesc = parsed.punctuations
        .map(
          (item, index) =>
            `问题${index + 1}：原文“${item.original}”，建议“${item.suggestion}”，原因：${item.reason}。`
        )
        .join("");
      parts.push(`标点提示：${punctuationDesc}`);
    }

    if (parsed.standards && parsed.standards.length > 0) {
      const standardsDesc = parsed.standards
        .map((item) => `• ${item}`)
        .join(" ");
      parts.push(`关联规范/标准：${standardsDesc}。后续可接入规范版本库进行核验。`);
    }

    if (parts.length === 0) {
      return "未发现明显问题，请结合上下文人工确认。";
    }

    return parts.join(" ");
  };

  const handleReview = async () => {
    if (!paragraphText.trim()) {
      setError("请先获取段落文本。");
      return;
    }

    setLoading(true);
    setError("");
    setCombinedResult("");
    setRawResponse("");

    try {
      const result = await callOpenAIForReview(paragraphText, openaiConfig);
      setRawResponse(result.rawResponse);

      try {
        const parsed = JSON.parse(result.rawResponse) as ParsedResult;
        const combined = buildCombinedResult(parsed);
        setCombinedResult(combined);
      } catch (parseErr) {
        console.error("解析模型输出失败", parseErr);
        setCombinedResult(result.rawResponse);
      }
    } catch (err: any) {
      console.error("调用模型失败", err);
      setError(`调用模型失败：${err?.message || "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "16px", fontFamily: "Segoe UI, sans-serif" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>AI 审查助手（段落级）</h1>
      <ol style={{ color: "#444", marginBottom: "16px", paddingLeft: "18px" }}>
        <li>将光标放在需要审查的段落，点击“获取当前段落”。</li>
        <li>确认段落文本无误后，点击“审查当前段落”。</li>
        <li>查看审查结果，可展开原始输出进行调试。</li>
      </ol>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={handleGetParagraph} disabled={loading}>
          获取当前段落
        </button>
        <button onClick={handleReview} disabled={loading}>
          {loading ? "审查中..." : "审查当前段落"}
        </button>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
          当前段落文本：
        </label>
        <textarea
          style={{ width: "100%", height: "80px", padding: "8px" }}
          readOnly
          value={paragraphText}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
          审查结果：
        </label>
        <textarea
          style={{ width: "100%", height: "180px", padding: "8px" }}
          readOnly
          value={combinedResult}
        />
      </div>

      {error && <div style={{ color: "red", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}

      <details>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>查看原始输出（调试用）</summary>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: "8px" }}>
          {rawResponse}
        </pre>
      </details>
    </main>
  );
};

export default App;
