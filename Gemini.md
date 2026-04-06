# English Tutor Assistant (SpeakStar) - 项目规范

本项目是一个基于 Next.js 的英语口语陪练应用，旨在通过大模型（Kimi/DeepSeek）为用户提供高质量的口语练习体验。

## 核心技术栈
- **框架**: Next.js 14+ (App Router)
- **样式**: TailwindCSS + shadcn/ui
- **语言**: TypeScript
- **状态管理**: Zustand
- **图标**: Lucide React
- **AI 接口**: Kimi / DeepSeek API (通过 Next.js Route Handlers 调用)

## 开发原则
1. **组件化**: 优先编写可复用的 UI 组件，保持 `components/` 目录整洁。
2. **类型安全**: 严禁使用 `any`，所有 API 响应和组件 Props 必须定义接口。
3. **响应式设计**: 必须适配移动端，因为口语练习常在手机上进行。
4. **流式响应**: AI 对话必须支持 Stream 流式输出以降低首包延迟。
5. **错误处理**: 妥善处理网络请求失败、麦克风权限被拒绝等异常情况。

## 目录结构约定
- `app/api/`: 后端接口 (Route Handlers)
- `components/`: UI 组件
- `hooks/`: 自定义 React Hooks (如语音处理逻辑)
- `lib/`: 工具函数与第三方库配置
- `store/`: Zustand 状态仓库
- `types/`: 全局 TypeScript 定义

## 特殊指令
- 在生成代码前，优先检查是否已有类似的 shadcn 组件可以使用。
- API 密钥必须通过 `.env.local` 管理，严禁硬编码。
- 语音交互逻辑应封装在独立的 Hook 中以解耦 UI。
