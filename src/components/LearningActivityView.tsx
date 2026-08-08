import { Alert } from '@mui/material';
import type { LearningActivity } from '../types/learning';
import {
  CompletedActivityView,
  LearningCardActivityView,
  PracticeActivityView,
  QuestionActivityView,
  QuickCheckActivityView,
  RetryActivityView,
} from './activity';

interface Props {
  activity: LearningActivity;
}

export function LearningActivityView({ activity }: Props) {
  switch (activity.type) {
    case 'QUESTION':
      return <QuestionActivityView activity={activity} />;
    case 'LEARNING_CARD':
      return <LearningCardActivityView activity={activity} />;
    case 'PRACTICE':
      return <PracticeActivityView activity={activity} />;
    case 'QUICK_CHECK':
      return <QuickCheckActivityView activity={activity} />;
    case 'RETRY':
      return <RetryActivityView activity={activity} />;
    case 'COMPLETED':
      return <CompletedActivityView activity={activity} />;
    default:
      return <Alert severity="error">Unsupported activity type</Alert>;
  }
}
