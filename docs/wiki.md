# word-ai-in 软件结构与函数说明

本文档总结了插件的主要目录结构、核心模块以及关键函数的职责，便于维护和二次开发。

## 目录概览

- `src/taskpane/`：任务窗格的前端界面与交互逻辑。
  - `index.html`：任务窗格的 HTML 模板，由 Webpack 注入构建产物。
  - `index.tsx`：React 入口文件，挂载任务窗格应用。
  - `App.tsx`：核心界面与业务逻辑，负责读取 Word 内容、调用模型并展示结果。
- `src/services/`：与后端或第三方服务交互的封装。
  - `openaiClient.ts`：封装模型调用，生成提示词并向 OpenAI 兼容接口发起请求。
- `manifest.xml`：Office 加载项清单，定义任务窗格入口与权限要求。
- `webpack.config.js`、`tsconfig.json`：构建与 TypeScript 配置。

## 关键组件与函数

### `src/taskpane/App.tsx`

- **状态管理**：
  - `paragraphText`：当前光标所在段落的文本。
  - `combinedResult`：解析后的审查结果，供用户直接阅读。
  - `rawResponse`：模型返回的原始 JSON 字符串，用于调试。
  - `loading`、`error`：加载与错误状态。
- **主要函数**：
  - `handleGetParagraph()`：通过 `Word.run` 获取用户当前段落文本，写入 `paragraphText`。
  - `buildCombinedResult(parsed)`：将模型解析结果（错别字、标点、规范编号）整合为可读字符串。
  - `handleReview()`：调用 `callOpenAIForReview`，将模型输出尝试解析为 JSON，并填充 `combinedResult` 与 `rawResponse`。
- **交互流程**：用户点击“获取当前段落”→ 确认文本 → 点击“审查当前段落”→ 查看结果或展开原始输出。

### `src/services/openaiClient.ts`

- `callOpenAIForReview(paragraphText, config)`：
  - 构造面向铁路通信/工程规范审校的系统提示词，要求返回包含 `typos`、`punctuations`、`standards` 字段的 JSON。
  - 归一化 `baseUrl` 并定位 `/v1/chat/completions` 接口。
  - 以 `Bearer` 头携带 `apiKey` 发送请求，温度默认为 0.1。
  - 返回 `rawResponse` 字符串（模型输出的消息内容），由调用方负责解析。

## 开发注意事项

- 在 `App.tsx` 中提前填好 `openaiConfig`，避免调用时报认证或路由错误。
- 模型输出应为 JSON，如解析失败会直接展示原始文本，可用来调试提示词或接口问题。
- 需要在 Word 中侧载 `manifest.xml` 才能看到任务窗格；前端修改后建议使用 `npm start` 提供的热更新提高效率。
