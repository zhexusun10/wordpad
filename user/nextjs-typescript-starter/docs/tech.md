# H5 Vocabulary & Exam Assistant 技术设计文档

## 1. 概述
- **目标**：构建一套面向移动端优先的 H5 应用，提供单词卡学习、试卷数字化、未来 AI 助手等功能，并保证前后端架构可扩展、数据一致可追踪。
- **范围**：涵盖 Next.js 前端与 API 层、PostgreSQL 数据库、文件存储与处理流水线、后续 AI 集成的占位设计。
- **设计原则**：界面简约统一、模块化、组件可复用；后端强调清晰的数据模型、可观测性与渐进式演进能力。

## 2. 系统架构总览
```
┌────────────┐       ┌────────────────┐       ┌──────────────────┐
│  浏览器端   │ ←HTTP→ │ Next.js App Router │ ←SQL→ │ PostgreSQL (RDS) │
│  (手机/平板) │       │  前端 UI + API 路由  │       │ card_set / exam 等 │
└────────────┘       │  上传 → 任务队列     │       └──────────────────┘
        ▲             │  (BullMQ/队列服务)  │                 ▲
        │  SSE/Webhook│                  │                 │
        │             └─────→ 处理器(Worker) ──→ 对象存储(S3 兼容) │
        │                                 │                 │
        └──────────── 实时状态/回调 ────────┴───── AI/RAG 服务 (未来)
```
- Next.js 作为统一入口，前台采用 App Router 渲染 UI，后台提供 `/api/*` REST/Edge 路由。
- 队列服务与 Worker 处理试卷 OCR/NLP 任务，可部署在同一 VPC 内。
- 对象存储用于缓存上传文件与解析产物（如图片切片、结构化 JSON）。
- 监控与日志集成平台（如 Vercel + Logflare、Grafana Loki）。

## 3. 后端设计

### 3.1 技术栈与模块
- **框架**：Next.js 14（App Router + Route Handler），以 TypeScript 编写。
- **ORM**：Drizzle ORM 管理 PostgreSQL schema 及迁移。
- **鉴权**：NextAuth.js，支持邮箱/第三方登录；匿名态使用 session cookie。
- **存储**：PostgreSQL 作为主数据源；对象存储 (S3 兼容) 保存 PDF、生成的图片、解析 JSON。
- **队列**：BullMQ + Redis 处理 OCR、NLP、AI 扩展任务。
- **日志监控**：使用 OpenTelemetry + 自建 Collector/第三方服务。

### 3.2 数据库模型
#### 3.2.1 核心单词学习表
| 表名 | 关键字段 | 描述 |
|------|----------|------|
| `users` | `id (uuid PK)`, `display_name`, `email`, `avatar_url`, `created_at`, `updated_at` | 认证用户信息。匿名用户不入库，仅使用 ephemeral session。|
| `card_set` | `set_id (text PK)`, `title`, `description`, `author_id (FK→users.id)`, `visibility (enum: private/public)`, `created_at`, `updated_at` | 单词集定义，默认私有，可扩展共享。|
| `card_set_tag` | `set_id (FK)`, `tag`, `created_at` | 存储标签，支持多标签查询。|
| `card` | `id (text PK)`, `set_id (FK→card_set.set_id)`, `ordinal`, `front_text`, `front_audio_url`, `back_definition`, `back_content`, `example_sentence`, `created_at`, `updated_at` | 单词卡；`ordinal` 保证展示顺序；预留音频/例句。|
| `user_card_set_progress` | `id (uuid PK)`, `user_id`, `set_id`, `studied_card_count`, `mastered_card_count`, `accuracy`, `last_reviewed_at`, `created_at`, `updated_at` | 记录用户对单词集整体进度，用于仪表板。|
| `user_card_progress` | `id (uuid PK)`, `user_id`, `card_id`, `status (enum: unknown/mastered/review)`, `last_result`, `attempt_count`, `last_reviewed_at`, `next_review_at` | 细粒度的卡片掌握度，为未来间隔重复做准备。|
| `study_session` | `id (uuid PK)`, `user_id`, `set_id`, `started_at`, `ended_at`, `total_cards`, `correct`, `incorrect`, `device_info` | 一次学习会话日志，便于统计与 AI 个性化。|

#### 3.2.2 试卷数字化表
| 表名 | 关键字段 | 描述 |
|------|----------|------|
| `exam_document` | `id (uuid PK)`, `owner_id (FK→users.id)`, `title`, `subject`, `grade`, `source`, `status (enum: uploaded/ocr/parsed/failed/completed)`, `file_url`, `structured_json_url`, `uploaded_at`, `completed_at` | 上传的原始试卷及处理状态。|
| `exam_processing_log` | `id (uuid PK)`, `exam_id`, `stage (uploaded/ocr/parse/postprocess)`, `status (pending/running/success/failed)`, `message`, `created_at` | 细化流水线阶段，支撑前端状态条。|
| `exam_section` | `id (uuid PK)`, `exam_id`, `ordinal`, `title`, `instruction` | 试卷中的大题/部分。|
| `exam_question` | `id (uuid PK)`, `section_id`, `ordinal`, `type (enum: single_choice/multi_choice/fill_blank/essay/upload)`, `stem_text`, `stem_rich_media`, `answer_key`, `analysis`, `points` | 结构化题目元数据。|
| `exam_option` | `id (uuid PK)`, `question_id`, `key`, `text`, `media_url`, `is_correct` | 客观题选项。|
| `exam_user_response` | `id (uuid PK)`, `exam_id`, `question_id`, `user_id`, `response_payload (jsonb)`, `submitted_at`, `score`, `feedback` | 用户作答记录，支持多端恢复。|

#### 3.2.3 AI 占位与系统表
| 表名 | 关键字段 | 描述 |
|------|----------|------|
| `ai_waitlist` | `id (uuid PK)`, `user_id`, `email`, `source`, `created_at` | 记录愿意体验 AI 功能的用户。|
| `file_asset` | `id (uuid PK)`, `owner_id`, `resource_type (enum)`, `url`, `checksum`, `metadata (jsonb)`, `created_at` | 抽象文件表，统一追踪上传资产。|
| `audit_event` | `id (uuid PK)`, `user_id`, `event_type`, `payload (jsonb)`, `created_at` | 系统审计与行为日志。|

### 3.3 关系与索引
- `card_set` 与 `card` 为一对多；`card_set_tag` 提供标签查询 (`idx_card_set_tag_tag`)。
- `user_card_progress` 通过 (`user_id`, `card_id`) 唯一索引保障幂等更新。
- `exam_section` 与 `exam_question`、`exam_option` 形成树状结构；`exam_user_response` 通过 (`user_id`, `question_id`) 唯一索引确保覆盖写入。
- 所有时间字段默认 `timestamptz`。

### 3.4 API 设计
#### 3.4.1 鉴权与用户
- `POST /api/auth/signin`：透传给 NextAuth provider。
- `GET /api/me`：返回 `display_name`, `recent_sets`, `exam_history`。

#### 3.4.2 单词集
- `GET /api/word-sets?scope=mine|public&cursor=`：分页获取 word sets。
- `POST /api/word-sets`：创建单词集；请求体包含 `title`, `description`, `tags`, `cards` 数组，支持 `import_format` 标识；同时写入 `card_set`, `card`, `card_set_tag`。
- `GET /api/word-sets/{setId}`：获取 metadata + cards（支持按批量 `?limit=20&offset=`）。
- `PATCH /api/word-sets/{setId}`：更新标题/描述/标签。
- `POST /api/word-sets/{setId}/study-sessions`：上传一次学习结果，自动更新 `user_card_set_progress`。
- `PATCH /api/cards/{cardId}/progress`：局部更新单卡掌握状态。

#### 3.4.3 试卷
- `POST /api/exams`：接收 PDF 上传（S3 预签名 URL），初始化状态为 `uploaded`，向队列发送任务。
- `GET /api/exams/{examId}`：返回 `exam_document` 元数据、当前状态、结构化结果（若完成）。
- `GET /api/exams/{examId}/sections`：懒加载 sections + questions。
- `POST /api/exams/{examId}/responses`：批量保存用户答案。
- `POST /api/exams/{examId}/retry-stage`：允许失败后重试特定流程。

#### 3.4.4 AI 占位
- `POST /api/ai/waitlist`：提交邮箱或用户 ID；用于前端订阅。

### 3.5 处理流程
1. **PDF 上传**：前端向 `POST /api/exams` 请求预签名 URL → 客户端直传对象存储 → 服务器写 `exam_document` 状态 `uploaded`。
2. **队列触发**：API 将任务推入 `ocr_pipeline` 队列，Worker 消费：
   - OCR 阶段：调用 OCR 服务（如 PaddleOCR/AWS Textract），输出中间 JSON。
   - 解析阶段：运行 NLP/规则引擎转换成结构化题目，写入 `exam_section`, `exam_question` 等。
   - 完成：上传结构化 JSON 至对象存储，更新 `exam_document.status = completed`。
3. **状态推送**：Worker 在每个阶段写 `exam_processing_log` 并触发 Pusher/Ably/SSE，前端刷新状态条。
4. **错误处理**：失败记录 `status = failed` + message，允许 `retry-stage`。

### 3.6 安全与合规
- 强制用户级访问控制：所有 word set 与 exam 资源通过 `author_id/owner_id` 校验。
- 上传文件限制：MIME 验证 + 文件大小 (<= 50MB)，病毒扫描（ClamAV Lambda）。
- 数据备份：PostgreSQL 日志归档，S3 版本化。
- 审计：关键操作写入 `audit_event`，支持后续风控与报表。

### 3.7 可观测性
- API 路由使用 OpenTelemetry trace，采样发送至集中式服务。
- Worker 记录处理时长与失败率，结合 Prometheus/Grafana 告警。
- 前端捕获错误上报到 Sentry/LogRocket。

## 4. 前端设计

### 4.1 技术栈
- Next.js App Router + React 18，结合 Server Components 提升首屏性能。
- 状态管理使用 React Query/SWR 处理数据获取；`zustand`／`useReducer` 管理局部 UI 状态（如模态、翻牌状态）。
- UI 风格：Tailwind CSS + 自定义主题 token（颜色、间距、圆角、阴影）。字体使用 Geist/默认系统字体，遵守移动端可读性。

### 4.2 布局与导航
- `app/(dashboard)/layout.tsx`：包裹 Left Sidebar + 主内容区域，Sidebar 在移动端折叠为底部抽屉或隐藏的图标栏。
- Sidebar 按钮使用统一的幽灵按钮风格，当前选中添加强调色（品牌主色）和 icon fill。
- 用户状态区固定在 Sidebar 底部，小屏转为顶部溢出菜单。

### 4.3 组件分层
- **基础组件**：`Button`, `Tag`, `ProgressBar`, `Card`, `EmptyState`, `ResponsiveGrid`。
- **复合组件**：
  - `WordSetCard`（标题、数量、标签、时间）
  - `StudyControls`（上一张/翻面/下一张/掌握按钮 + 手势支持）
  - `ExamUploader`（拖拽上传、状态条、历史列表）
  - `ExamQuestionRenderer`（根据题型动态渲染）
  - `AIPlaceholder`（订阅表单）
- **页面级容器**：`WordSetDashboardPage`, `StudyPage`, `ExamPage`, `AIFuturePage`。

### 4.4 页面交互细节
- **单词卡列表页**：
  - 顶部展示最近进度模块（React Query 自动刷新 `user_card_set_progress`）。
  - 自定义单词集使用响应式卡片列表，>=768px 显示 3 列，移动端单列。
  - “创建单词集”按钮触发 `WordSetImportModal`，提供 tab 切换：文本粘贴/JSON 上传。
- **学习页**：
  - 默认显示正面，点击或左右滑动翻转；使用 Framer Motion 过渡。
  - “掌握/未掌握”更新 `user_card_progress`，乐观更新进度条和统计。
  - `StudySessionBanner` 展示累计统计、自动播放设置占位。
- **试卷页**：
  - 上传区域支持拖拽/点击；显示允许类型、大小提示。
  - 状态条使用 `exam_processing_log` 数据驱动，显示当前阶段与成功/失败提示。
  - 结构化结果分页渲染，每个 Section 折叠/展开；题目组件按类型切换输入控件。
  - 用户答案使用本地缓存 (IndexedDB) + `POST /responses` 保存。
- **AI 占位页**：
  - 显示 Coming Soon 信息、插画占位。
  - 订阅表单验证邮箱，调用 `/api/ai/waitlist`。

### 4.5 设计规范
- **配色**：主色选择高可读蓝/紫系，辅色用于状态 (success/error/warning)。背景大量留白，卡片圆角 12px。
- **排版**：标题采用 `text-lg/font-semibold`，正文 `text-sm`，行距保证触控易读。
- **图标**：使用一致的 icon set（Lucide/Phosphor），线性风格，保持权重统一。
- **响应式**：断点 `sm: 375px`, `md: 768px`, `lg: 1280px`，确保按钮高度≥44px。
- **可访问性**：颜色对比满足 WCAG AA；为重要控件添加 ARIA 标签和键盘导航。

### 4.6 状态管理与数据刷新
- React Query Query Keys：
  - `['me']`, `['wordSets', scope, cursor]`, `['wordSet', setId]`, `['studyProgress', setId]`, `['exam', examId]`, `['exam', examId, 'sections']`。
- 使用乐观更新 + 失败回滚（`onError` 恢复旧状态）。
- SSE/Pusher 事件监听考试状态变化，触发 `invalidateQueries(['exam', id])`。

## 5. 关键流程

### 5.1 单词集导入流程
1. 用户点击“创建单词集” → 打开导入弹窗。
2. 前端对文本进行快速校验（拆分 `word | definition | extra`）。
3. 调用 `POST /api/word-sets`，后端解析/存储：
   - 生成 `set_id`，写入 `card_set`、`card`、`card_set_tag`。
   - 创建默认 `user_card_set_progress` 记录。
4. 返回新集合数据，前端更新列表并跳转至详情。

### 5.2 学习会话数据流
1. 进入学习页，预加载下一批卡片。
2. 用户操作按钮或手势切换卡片、标记掌握。
3. 每次标记调用 `PATCH /api/cards/{id}/progress`（批量时可合并）。
4. 退出页时发送 `POST /study-sessions` 汇总结果；后台计算准确率、更新 `user_card_set_progress`。

### 5.3 试卷上传与解析
1. 上传 PDF → API 生成预签名 URL → 前端直传。
2. API 写入 `exam_document` (`status=uploaded`)，推送队列。
3. Worker 执行 OCR/NLP，期间写 `exam_processing_log`。
4. 完成后生成结构化 JSON，写入 `exam_section` 等表。
5. 前端通过轮询或 SSE 获知 `status=completed`，展示解析结果。
6. 用户填写答案，`POST /responses` 保存，支持后续统计与 AI 解析。

## 6. 部署与环境
- **环境划分**：`dev`（本地）、`staging`、`production`。
- **配置管理**：使用 Vercel 环境变量或自建 Vault；敏感配置（数据库、Redis、S3 凭证）通过 KMS 加密。
- **迁移**：Drizzle Migrations 与 CI 集成，部署前执行 `pnpm drizzle-kit push`。
- **CI/CD**：GitHub Actions → Lint/Test → 预览部署 → 合并后自动部署生产。

## 7. 测试策略
- **单元测试**：业务逻辑（词汇解析器、OCR 结果解析器）。
- **集成测试**：API Route Handler 与数据库通过 Supabase Local/pg Test Container。
- **端到端**：Playwright 覆盖关键用户路径（单词学习、试卷上传）。
- **可观测性测试**：模拟失败场景验证告警。

## 8. 风险与缓解
- OCR 精度不稳定 → 提供人工校正入口，记录疑似问题题目。
- 大文件上传失败 → 分片上传、断点续传方案（Tus/S3 Multipart）。
- 移动端性能 → 懒加载卡片、一致的骨架屏。
- 数据隐私 → 严格的访问控制、GDPR/未成年人合规策略。

## 9. 未来路线图
- 引入间隔重复算法 (SM-2) 与个性化推荐。
- 试卷解析增加答案解析 AI，自动批改主观题。
- AI Tab 集成多轮对话、上下文检索 (RAG)。
- 多端同步（移动/桌面）

