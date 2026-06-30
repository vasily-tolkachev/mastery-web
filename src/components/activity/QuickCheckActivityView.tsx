import { Stack, Typography } from '@mui/material';
import type { QuickCheckActivity } from '../../types/learning';

interface Props {
  activity: QuickCheckActivity;
}

export function QuickCheckActivityView({ activity }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">Quick Check</Typography>
      <Typography>{activity.question ?? 'No question available'}</Typography>
    </Stack>
  );
}
