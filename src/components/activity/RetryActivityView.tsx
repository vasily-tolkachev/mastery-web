import { List, ListItem, Paper, Stack, Typography } from '@mui/material';
import type { RetryActivity } from '../../types/learning';

interface Props {
  activity: RetryActivity;
}

export function RetryActivityView({ activity }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="h6">Retry</Typography>
      <Typography>{activity.question ?? 'No retry question'}</Typography>
      {activity.rubric.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 1 }}>
          <List dense>
            {activity.rubric.map((line, index) => (
              <ListItem key={index}>{line}</ListItem>
            ))}
          </List>
        </Paper>
      ) : null}
    </Stack>
  );
}
