import { Stack, Typography } from '@mui/material';
import type { QuestionActivity } from '../../types/learning';

interface Props {
  activity: QuestionActivity;
}

export function QuestionActivityView({ activity }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">Question</Typography>
      <Typography>{activity.text ?? 'No question text'}</Typography>
    </Stack>
  );
}
