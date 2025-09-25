import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const cardVisibilityEnum = pgEnum('card_visibility', ['private', 'public']);

export const cardMasteryStatusEnum = pgEnum('card_mastery_status', [
  'unknown',
  'mastered',
  'review',
]);

export const examStatusEnum = pgEnum('exam_status', [
  'uploaded',
  'ocr',
  'parsed',
  'failed',
  'completed',
]);

export const examProcessingStageEnum = pgEnum('exam_processing_stage', [
  'uploaded',
  'ocr',
  'parse',
  'postprocess',
]);

export const examProcessingStatusEnum = pgEnum('exam_processing_status', [
  'pending',
  'running',
  'success',
  'failed',
]);

export const examQuestionTypeEnum = pgEnum('exam_question_type', [
  'single_choice',
  'multi_choice',
  'fill_blank',
  'essay',
  'upload',
]);

export const examAnswerFieldEnum = pgEnum('exam_answer_field', [
  'single_choice',
  'multi_choice',
  'fill_blank',
  'essay',
  'upload',
  'text',
]);

export const fileResourceTypeEnum = pgEnum('file_resource_type', [
  'word_set',
  'exam_document',
  'exam_asset',
  'card_media',
  'other',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    displayName: varchar('display_name', { length: 128 }),
    email: varchar('email', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    passwordHash: varchar('password_hash', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIndex: uniqueIndex('users_email_unique').on(table.email),
  })
);

export const cardSets = pgTable(
  'card_set',
  {
    setId: text('set_id').primaryKey(),
    title: varchar('title', { length: 256 }).notNull(),
    description: text('description'),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    visibility: cardVisibilityEnum('visibility').notNull().default('private'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    authorIndex: index('card_set_author_id_idx').on(table.authorId),
    updatedAtIndex: index('card_set_updated_at_idx').on(table.updatedAt),
  })
);

export const cardSetTags = pgTable(
  'card_set_tag',
  {
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.setId, { onDelete: 'cascade' }),
    tag: varchar('tag', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ name: 'card_set_tag_pk', columns: [table.setId, table.tag] }),
    tagIndex: index('card_set_tag_tag_idx').on(table.tag),
  })
);

export const cards = pgTable(
  'card',
  {
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.setId, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    frontText: text('front_text').notNull(),
    frontAudioUrl: text('front_audio_url'),
    backDefinition: text('back_definition'),
    backContent: text('back_content'),
    exampleSentence: text('example_sentence'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    setIndex: index('card_set_id_idx').on(table.setId),
    ordinalUnique: uniqueIndex('card_set_ordinal_unique').on(table.setId, table.ordinal),
  })
);

export const userCardSetProgress = pgTable(
  'user_card_set_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.setId, { onDelete: 'cascade' }),
    studiedCardCount: integer('studied_card_count').notNull().default(0),
    masteredCardCount: integer('mastered_card_count').notNull().default(0),
    accuracy: numeric('accuracy', { precision: 5, scale: 2 }).notNull().default('0'),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userSetUnique: uniqueIndex('user_card_set_progress_user_set_unique').on(
      table.userId,
      table.setId,
    ),
    setIndex: index('user_card_set_progress_set_idx').on(table.setId),
  })
);

export const userCardProgress = pgTable(
  'user_card_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    status: cardMasteryStatusEnum('status').notNull().default('unknown'),
    lastResult: varchar('last_result', { length: 32 }),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userCardUnique: uniqueIndex('user_card_progress_user_card_unique').on(
      table.userId,
      table.cardId,
    ),
    cardIndex: index('user_card_progress_card_idx').on(table.cardId),
  })
);

export const studySessions = pgTable(
  'study_session',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    setId: text('set_id')
      .notNull()
      .references(() => cardSets.setId, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    totalCards: integer('total_cards').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    incorrect: integer('incorrect').notNull().default(0),
    deviceInfo: text('device_info'),
  },
  (table) => ({
    userIndex: index('study_session_user_idx').on(table.userId),
    setIndex: index('study_session_set_idx').on(table.setId),
  })
);

export const examDocuments = pgTable(
  'exam_document',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 128 }),
    grade: varchar('grade', { length: 64 }),
    source: varchar('source', { length: 128 }),
    status: examStatusEnum('status').notNull().default('uploaded'),
    fileUrl: text('file_url').notNull(),
    structuredJsonUrl: text('structured_json_url'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    ownerIndex: index('exam_document_owner_idx').on(table.ownerId),
    statusIndex: index('exam_document_status_idx').on(table.status),
  })
);

export const examProcessingLogs = pgTable(
  'exam_processing_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    examId: uuid('exam_id')
      .notNull()
      .references(() => examDocuments.id, { onDelete: 'cascade' }),
    stage: examProcessingStageEnum('stage').notNull(),
    status: examProcessingStatusEnum('status').notNull().default('pending'),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    examIndex: index('exam_processing_log_exam_idx').on(table.examId),
  })
);

export const examSections = pgTable(
  'exam_section',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    examId: uuid('exam_id')
      .notNull()
      .references(() => examDocuments.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    title: varchar('title', { length: 255 }),
    instruction: text('instruction'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    examIndex: index('exam_section_exam_idx').on(table.examId),
    ordinalUnique: uniqueIndex('exam_section_exam_ordinal_unique').on(
      table.examId,
      table.ordinal,
    ),
  })
);

export const examQuestions = pgTable(
  'exam_question',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => examSections.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    type: examQuestionTypeEnum('type').notNull(),
    prompt: text('prompt').notNull(),
    media: jsonb('media'),
    answerField: examAnswerFieldEnum('answer_field').notNull().default('text'),
    answerKey: text('answer_key'),
    analysis: text('analysis'),
    points: numeric('points', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sectionIndex: index('exam_question_section_idx').on(table.sectionId),
    ordinalUnique: uniqueIndex('exam_question_section_ordinal_unique').on(
      table.sectionId,
      table.ordinal,
    ),
  })
);

export const examOptions = pgTable(
  'exam_option',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => examQuestions.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 16 }).notNull(),
    text: text('text'),
    mediaUrl: text('media_url'),
    isCorrect: boolean('is_correct').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    questionIndex: index('exam_option_question_idx').on(table.questionId),
    keyUnique: uniqueIndex('exam_option_question_key_unique').on(table.questionId, table.key),
  })
);

export const examUserResponses = pgTable(
  'exam_user_response',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    examId: uuid('exam_id')
      .notNull()
      .references(() => examDocuments.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => examQuestions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    responsePayload: jsonb('response_payload').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    score: numeric('score', { precision: 5, scale: 2 }),
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    examIndex: index('exam_user_response_exam_idx').on(table.examId),
    userQuestionUnique: uniqueIndex('exam_user_response_user_question_unique').on(
      table.userId,
      table.questionId,
    ),
  })
);

export const aiWaitlist = pgTable(
  'ai_waitlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: varchar('email', { length: 255 }),
    source: varchar('source', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex('ai_waitlist_email_unique').on(table.email),
  })
);

export const fileAssets = pgTable(
  'file_asset',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resourceType: fileResourceTypeEnum('resource_type').notNull(),
    url: text('url').notNull(),
    checksum: varchar('checksum', { length: 128 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIndex: index('file_asset_owner_idx').on(table.ownerId),
    resourceTypeIndex: index('file_asset_resource_type_idx').on(table.resourceType),
  })
);

export const auditEvents = pgTable(
  'audit_event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 128 }).notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIndex: index('audit_event_user_idx').on(table.userId),
    eventTypeIndex: index('audit_event_type_idx').on(table.eventType),
  })
);

