import { Alert, Box, Chip, List, ListItem, Paper, Stack, Typography } from '@mui/material';
import type { LearningActivity } from '../types/learning';

interface Props {
  activity: LearningActivity;
}

export function LearningActivityView({ activity }: Props) {
  if (activity.type === 'QUESTION') {
    return (
      <Box>
        <Typography variant="h6">Вопрос</Typography>
        <Typography sx={{ mt: 1 }}>{activity.text ?? 'Нет текста вопроса'}</Typography>
      </Box>
    );
  }

  if (activity.type === 'LEARNING_CARD') {
    return (
      <Box>
        <Typography variant="h6">{activity.title ?? 'Карточка обучения'}</Typography>
        <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
          {activity.explanation ?? 'Нет объяснения'}
        </Typography>
      </Box>
    );
  }

  if (activity.type === 'PRACTICE') {
    const item = activity.items[0];
    return (
      <Box>
        <Typography variant="h6">
          Практика {activity.currentItem ?? 1}/{activity.totalItems ?? 1}
        </Typography>
        {item ? (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography>{item.question ?? 'Нет текста практики'}</Typography>
            <Chip label={`Тип: ${item.type}`} sx={{ alignSelf: 'flex-start' }} />
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
          <Alert severity="warning" sx={{ mt: 1 }}>
            Нет practice item
          </Alert>
        )}
      </Box>
    );
  }

  if (activity.type === 'QUICK_CHECK') {
    return (
      <Box>
        <Typography variant="h6">Быстрая проверка</Typography>
        <Typography sx={{ mt: 1 }}>{activity.question ?? 'Нет вопроса'}</Typography>
      </Box>
    );
  }

  if (activity.type === 'RETRY') {
    return (
      <Box>
        <Typography variant="h6">Повтор</Typography>
        <Typography sx={{ mt: 1 }}>{activity.question ?? 'Нет вопроса'}</Typography>
        {activity.rubric.length > 0 ? (
          <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
            <List dense>
              {activity.rubric.map((line, index) => (
                <ListItem key={index}>{line}</ListItem>
              ))}
            </List>
          </Paper>
        ) : null}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6">Завершено</Typography>
      <Typography sx={{ mt: 1 }}>{activity.summary ?? 'Сессия завершена'}</Typography>
    </Box>
  );
}
