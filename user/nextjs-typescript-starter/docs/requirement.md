# H5 Vocabulary & Exam Assistant Requirements

## 1. Objective
- Deliver a mobile-first H5 web application that helps users study vocabulary via flashcards, convert PDF exam papers into structured digital practice, and later augments both experiences with AI/RAG insights.
- Support authenticated users with personalized progress tracking, word set curation, and uploaded exam analysis.

## 2. Scope & Personas
- **Primary learner**: K12 or adult learner practicing English vocabulary and exam papers on mobile or tablet.
- **Returning learner**: Authenticated user who expects to resume word sets and exam reviews with saved progress.
- **Future AI usage**: Same user base leveraging AI assistant for explanations and adaptive study plans (implementation deferred).

## 3. High-Level User Journeys
- **Vocabulary learning**: Open app → select “单词卡” → resume recent set or pick/create a new set → flip through cards, mark progress.
- **Exam digitization**: Open app → select “试卷” → upload/import PDF → wait for OCR & NLP pipeline → interact with structured questions and type answers inline.
- **AI support (future)**: Open app → select “AI” → query about words or questions. UI placeholder shipped now.

## 4. Functional Requirements

### 4.1 Global Layout & Navigation Sidebar
- Persistent left sidebar with four vertically stacked buttons: 1) `单词卡`, 2) `试卷`, 3) `AI` (disabled/coming soon indicator), 4) user status anchored at sidebar bottom showing avatar/initials + display name or “未登录”.
- Highlight active view; use recognizable icons + labels.
- Sidebar collapses into an icon rail on small screens; bottom user status remains visible.

### 4.2 Authentication & User State
- Support anonymous browsing but restrict personalized data to authenticated users.
- When logged in, fetch and cache: display name, recent word sets, saved custom sets, exam history.
- Provide login entry via user status button; clicking when unauthenticated triggers login modal/redirect (outside this scope but must be link-ready).

### 4.3 Vocabulary Dashboard (单词卡列表页)
- **Recent Progress module**: Visible only if authenticated and at least one set has progress; show up to three sets with progress bars (% completed) and “继续学习” CTA.
- **Custom Sets section**: Grid/list of user-created sets ordered by updated time; card shows title, word count, tags, last studied timestamp.
- **Add Set entry**: Prominent button above grid; triggers modal to import word list.
- Support pagination or infinite scroll when user owns many sets.

### 4.4 Word Card Study View
- Entry from Recent Progress or Custom Sets.
- Show set metadata (title, description, tags, progress indicator, total cards).
- Default view: display first card front (English word). Tap/press flips to back (definition + extra content). Maintain flip state after transitions.
- Provide controls: `上一张`, `翻面`, `下一张`, plus actions to mark “掌握/未掌握”.
- Track study metrics: cards viewed, accuracy, last reviewed timestamp.
- Allow optional auto-play (future) but stub settings placeholder now.

### 4.5 Word Set Management & Creation
- **Import modal**: Triggered from “创建单词集” entry. Includes fields for set title, description, tags, input area for words.
- **Input format guidance**: Provide instructions + template; support copy-paste lines in `word | definition | extra` form or JSON upload.
- **Validation**: Require non-empty title and at least one valid card. Highlight parsing errors inline.
- **Data storage**: Persist new sets and cards via API (details TBD); ensure immediate UI refresh to show new set.

### 4.6 Exam Paper Workflow (试卷页)
- Top banner/card instructing user to upload PDF; show allowed file types, max size, privacy note.
- Once uploaded, show pipeline status chips: `上传成功` → `OCR` → `解析` → `结构化完成`.
- Persist parsed result in JSON schema capturing: exam metadata (title, subject, grade, source), ordered sections, questions, options, answers (if provided), image references.
- Present structured exam below status area with pagination by section and inline answer fields (text input, multiple choice, file upload for handwriting if needed).
- Allow user to download structured JSON and resume incomplete exams later.

### 4.7 AI Assistant (AI页)
- Placeholder screen with messaging about upcoming features and opt-in to notify the user when ready.
- Reserve input area and conversation list structure to ease future integration.

### 4.8 Global Considerations
- Responsive layout prioritizing vertical scrolling; ensure core features usable on 375px width.
- Persist theme tokens for consistent spacing/typography.
- Provide empty states and error states (no recent sets, OCR failure, etc.).

## 5. Data & Content Requirements
- **Word set object**
  ```json
  {
    "set_id": "set_1001",
    "title": "基础英语动词",
    "description": "常用的100个英语动词",
    "author": "user_001",
    "created_at": "2025-09-26T10:00:00Z",
    "updated_at": "2025-09-26T10:00:00Z",
    "tags": ["英语", "动词", "基础"]
  }
  ```
- **Word card object**
  ```json
  {
    "id": "card_001",
    "set_id": "set_1001",
    "order": 1,
    "front": { "text": "eat" },
    "back": {
      "definition": "吃",
      "content": "动词 vt./vi. 吃；用餐"
    }
  }
  ```
- Support optional `content` (rich text, media references) on card back; handle null gracefully.
- Exam JSON schema (draft):
  ```json
  {
    "exam_id": "exam_2025_001",
    "title": "2025年高考英语模拟卷",
    "metadata": {
      "subject": "英语",
      "grade": "高三",
      "source": "校内模拟",
      "uploaded_by": "user_001",
      "created_at": "2025-10-01T08:00:00Z"
    },
    "sections": [
      {
        "section_id": "sec_1",
        "title": "听力理解",
        "description": null,
        "questions": [
          {
            "question_id": "q_1",
            "type": "single_choice",
            "prompt": "What is the speaker mainly talking about?",
            "options": [
              { "option_id": "A", "text": "Their weekend plans" },
              { "option_id": "B", "text": "A recent movie" }
            ],
            "media": { "audio": "media/audio/q1.mp3", "images": [] },
            "answer_field": "single_choice",
            "answer_key": "A"
          }
        ]
      }
    ]
  }
  ```

## 6. PDF → OCR → JSON Pipeline
- **Upload handling**: Validate PDF, chunk pages for concurrent OCR.
- **OCR**: Use service (e.g., PaddleOCR/Tesseract). Detect both text blocks and embedded images; output positional data.
- **NLP parsing**: Classify question types, split stem/options/answers, detect numbering, map images to questions.
- **Post-processing**: Normalize to schema, generate asset references for stored images, handle tables/formulas with MathML or image fallback.
- **Monitoring**: Surface pipeline status and retry options; log failures for manual review.
- **Storage**: Persist raw OCR output, structured JSON, and original PDF for auditing.

## 7. Non-Functional Requirements
- Target performance: initial load <3s on 4G network; subsequent navigations via client routing.
- Accessibility: Provide alt text, keyboard navigation, adequate color contrast, focus states.
- Localization: Default zh-CN UI strings; allow content (word definitions) to remain bilingual.
- Security: Require authenticated endpoints for user data; sanitize uploads; virus-scan PDFs before processing.

## 8. Wireframes & UI Layout Sketches

### 8.1 Global Layout with Sidebar
```
+------------------------------------------------------------+
| SIDEBAR     |                MAIN CONTENT                  |
|-------------+----------------------------------------------|
| [单词卡]    |                                              |
| [试卷]      |                                              |
| [AI]  (禁用)|                                              |
|             |                                              |
|             |                                              |
|             |                                              |
|             |                                              |
|             |                                              |
|             |                                              |
|-------------+----------------------------------------------|
| 用户头像+名 |                                              |
+------------------------------------------------------------+
```

### 8.2 单词卡列表页 (Dashboard)
```
+------------------------------------------------------------+
| SIDEBAR |  页面标题: 单词卡                                 |
|         |--------------------------------------------------|
|         |  最近学习                                        |
|         |  +------------------------------+                |
|         |  | 集合名  | 进度条 [%] | 继续学习 > |          |
|         |  +------------------------------+                |
|         |  (无数据时隐藏此模块)                           |
|         |--------------------------------------------------|
|         |  自定义单词集                                    |
|         |  [创建单词集 +]                                  |
|         |  +----------------+  +----------------+          |
|         |  | 集合卡片       |  | 集合卡片       |          |
|         |  | 标题/数量/标签 |  | 标题/数量/标签 |          |
|         |  +----------------+  +----------------+          |
+------------------------------------------------------------+
```

### 8.3 创建单词集弹窗
```
+--------------------------------------+
| 创建单词集                           |
|--------------------------------------|
| 标题 [______________]                |
| 描述 [______________]                |
| 标签 [____][添加]                    |
|--------------------------------------|
| 导入词汇                             |
| 说明: word | definition | extra      |
| [ 多行文本框输入区               ]   |
| [ 上传 JSON 文件 ] (可选)            |
|--------------------------------------|
| [取消]              [保存并解析]     |
+--------------------------------------+
```

### 8.4 单词卡学习页
```
+------------------------------------------------------------+
| SIDEBAR |  集合信息: 标题 / 标签 / 进度                    |
|         |--------------------------------------------------|
|         |  +------------------------------+                |
|         |  |            正面              |                |
|         |  |            eat               |                |
|         |  +------------------------------+                |
|         |  动作区域: [上一张] [翻面] [下一张] [掌握]       |
|         |  底部显示学习统计: 已学习X/总数, 正确率等        |
+------------------------------------------------------------+
```

### 8.5 试卷页
```
+------------------------------------------------------------+
| SIDEBAR |  页面标题: 试卷                                   |
|         |--------------------------------------------------|
|         |  上传提醒卡片                                     |
|         |  [ 导入PDF按钮 ]  [ 状态: 上传 -> OCR -> 解析 ]   |
|         |--------------------------------------------------|
|         |  解析结果 (JSON 渲染)                             |
|         |  Section 1 标题                                   |
|         |    Q1. 题干文本                                   |
|         |       (图片缩略图)                                |
|         |       选项 A/B/C/D (可点选)                      |
|         |       [ 作答输入区 ]                              |
|         |  --- 分页或折叠 ---                               |
+------------------------------------------------------------+
```

### 8.6 AI 页 (占位)
```
+------------------------------------------------------------+
| SIDEBAR |  页面标题: AI                                    |
|         |--------------------------------------------------|
|         |  AI功能即将上线                                   |
|         |  [ 订阅更新按钮 ]                                 |
|         |  预留对话列表 + 输入框占位                       |
+------------------------------------------------------------+
```

## 9. Open Questions & Next Steps
- Decide on backend services for authentication, word set persistence, and exam storage.
- Choose OCR provider and hosting for media assets extracted from PDFs.
- Confirm import formats beyond plain text (CSV, Excel?).
- Define AI/RAG data sources and latency requirements before activating the AI tab.

