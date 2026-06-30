import { Stack, Typography } from '@mui/material';
import type { CompletedActivity } from '../../types/learning';

interface Props {
  activity: CompletedActivity;
}

export function CompletedActivityView({ activity }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">Completed</Typography>
      <Typography>{activity.summary ?? 'Session completed'}</Typography>
    </Stack>
  );
}
