import { Alert, Chip, List, ListItem, Paper, Stack, Typography } from '@mui/material';
import type { PracticeActivity } from '../../types/learning';

interface Props {
  activity: PracticeActivity;
}

export function PracticeActivityView({ activity }: Props) {
  const index = Math.max(0, (activity.currentItem ?? 1) - 1);
  const item = activity.items[index];

  return (
    <Stack spacing={1}>
      <Typography variant="h6">
        Practice {activity.currentItem ?? 1}/{activity.totalItems ?? 1}
      </Typography>
      {item ? (
        <Stack spacing={1}>
          <Typography>{item.question ?? 'No practice text'}</Typography>
          <Chip label={`Type: ${item.type}`} sx={{ alignSelf: 'flex-start' }} />
          {item.options.length > 0 ? (
            <Paper variant="outlined" sx={{ p: 1 }}>
              <List dense>
                {item.options.map((option, index) => (
                  <ListItem key={index}>{`${index + 1}. ${option}`}</ListItem>
                ))}
              </List>
            </Paper>
          ) : null}
        </Stack>
      ) : (
        <Alert severity="warning">No practice item</Alert>
      )}
    </Stack>
  );
}
