import { Stack, Typography } from '@mui/material';
import type { LearningCardActivity } from '../../types/learning';

interface Props {
  activity: LearningCardActivity;
}

export function LearningCardActivityView({ activity }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">{activity.title ?? 'Learning Card'}</Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
        {activity.explanation ?? 'No explanation available'}
      </Typography>
    </Stack>
  );
}
