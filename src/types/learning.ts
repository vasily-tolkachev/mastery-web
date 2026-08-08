export type ActivityType =
  | 'QUESTION'
  | 'LEARNING_CARD'
  | 'PRACTICE'
  | 'QUICK_CHECK'
  | 'RETRY'
  | 'COMPLETED';

export interface LearningContext {
  topicId: number | null;
  topicName: string | null;
  conceptId: number | null;
  conceptName: string | null;
  microConceptId: number | null;
  microConceptName: string | null;
}

export interface ProgressSnapshot {
  conceptOrder: number | null;
  totalConcepts: number | null;
  microConceptOrder: number | null;
  totalMicroConcepts: number | null;
  answeredCount: number;
}

export interface AvailableAction {
  type:
    | 'START_LEARNING'
    | 'SUBMIT_ANSWER'
    | 'CONTINUE_LEARNING'
    | 'SUBMIT_PRACTICE'
    | 'SUBMIT_QUICK_CHECK'
    | 'SUBMIT_RETRY';
  enabled: boolean;
}

export interface BaseActivity {
  type: ActivityType;
}

export interface QuestionActivity extends BaseActivity {
  type: 'QUESTION';
  questionId: number | null;
  text: string | null;
  difficulty: string | null;
  questionType: string | null;
}

export interface LearningCardActivity extends BaseActivity {
  type: 'LEARNING_CARD';
  title: string | null;
  explanation: string | null;
}

export interface PracticeItemView {
  type: 'TRUE_FALSE' | 'MULTIPLE_CHOICE' | 'MULTI_SELECT' | 'ORDERING' | 'MATCHING' | string;
  question: string | null;
  options: string[];
  leftItems: string[];
  rightItems: string[];
}

export interface PracticeActivity extends BaseActivity {
  type: 'PRACTICE';
  currentItem: number | null;
  totalItems: number | null;
  items: PracticeItemView[];
}

export interface QuickCheckActivity extends BaseActivity {
  type: 'QUICK_CHECK';
  questionType: PracticeItemView['type'] | null;
  question: string | null;
  options: string[];
  leftItems: string[];
  rightItems: string[];
}

export interface RetryActivity extends BaseActivity {
  type: 'RETRY';
  questionType: PracticeItemView['type'] | null;
  question: string | null;
  options: string[];
  leftItems: string[];
  rightItems: string[];
}

export interface CompletedActivity extends BaseActivity {
  type: 'COMPLETED';
  summary: string | null;
}

export type LearningActivity =
  | QuestionActivity
  | LearningCardActivity
  | PracticeActivity
  | QuickCheckActivity
  | RetryActivity
  | CompletedActivity;

export interface LearningState {
  schemaVersion: number;
  sessionId: string | null;
  userId: string;
  phase:
    | 'QUESTION'
    | 'LEARNING_CARD'
    | 'PRACTICE'
    | 'QUICK_CHECK'
    | 'RETRY'
    | 'COMPLETED';
  context: LearningContext;
  progress: ProgressSnapshot;
  currentActivity: LearningActivity;
  availableActions: AvailableAction[];
}
