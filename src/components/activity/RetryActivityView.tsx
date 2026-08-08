import { Chip, Stack, Typography } from '@mui/material';
import type { RetryActivity } from '../../types/learning';

interface Props {
  activity: RetryActivity;
}

export function RetryActivityView({ activity }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">Retry</Typography>
      <Typography>{activity.question ?? 'No retry question'}</Typography>
      <Chip label={`Type: ${activity.questionType ?? 'UNKNOWN'}`} sx={{ alignSelf: 'flex-start' }} />
    </Stack>
  );
}
