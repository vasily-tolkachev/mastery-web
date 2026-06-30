import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { LearningActivityView } from '../components/LearningActivityView';
import {
  useContinueLearning,
  useLearningState,
  useStartLearning,
  useSubmitAnswer,
  useSubmitPractice,
  useSubmitQuickCheck,
  useSubmitRetry,
} from '../hooks/useLearning';
import type { LearningState } from '../types/learning';

const DEFAULT_USER_ID = 'demo-user';

function parsePracticeInput(input: string): { booleanAnswer: boolean | null; selectedOptions: number[] } {
  const normalized = input.trim().toLowerCase();
  const booleanAnswer =
    normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y' || normalized === 'да'
      ? true
      : normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'n' || normalized === 'нет'
        ? false
        : null;

  const selectedOptions = normalized
    .split(/[,\s;/|]+/)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isInteger(value));

  return { booleanAnswer, selectedOptions };
}

function buildStateSummary(state: LearningState): string {
  const topic = state.context.topicName ?? '-';
  const concept = state.context.conceptName ?? '-';
  const progress = `${state.progress.conceptOrder ?? '-'}/${state.progress.totalConcepts ?? '-'}`;
  return `Тема: ${topic} | Концепт: ${concept} | Прогресс: ${progress}`;
}

export function LearningPage() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [input, setInput] = useState('');

  const learningStateQuery = useLearningState(userId);
  const startMutation = useStartLearning(userId);
  const submitAnswerMutation = useSubmitAnswer(userId);
  const continueMutation = useContinueLearning(userId);
  const practiceMutation = useSubmitPractice(userId);
  const quickCheckMutation = useSubmitQuickCheck(userId);
  const retryMutation = useSubmitRetry(userId);

  const state = learningStateQuery.data;
  const isPending =
    learningStateQuery.isLoading ||
    startMutation.isPending ||
    submitAnswerMutation.isPending ||
    continueMutation.isPending ||
    practiceMutation.isPending ||
    quickCheckMutation.isPending ||
    retryMutation.isPending;

  const error = learningStateQuery.error ?? startMutation.error ?? submitAnswerMutation.error;

  const canSubmitInput = useMemo(() => {
    if (!state) return false;
    return state.currentActivity.type !== 'LEARNING_CARD' && state.currentActivity.type !== 'COMPLETED';
  }, [state]);

  const handleSubmit = async () => {
    if (!state) return;
    if (state.currentActivity.type === 'QUESTION') {
      await submitAnswerMutation.mutateAsync(input);
      setInput('');
      return;
    }
    if (state.currentActivity.type === 'PRACTICE') {
      const practicePayload = parsePracticeInput(input);
      await practiceMutation.mutateAsync(practicePayload);
      setInput('');
      return;
    }
    if (state.currentActivity.type === 'QUICK_CHECK') {
      await quickCheckMutation.mutateAsync(input);
      setInput('');
      return;
    }
    if (state.currentActivity.type === 'RETRY') {
      await retryMutation.mutateAsync(input);
      setInput('');
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Learning State</Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                label="User ID"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                size="small"
                fullWidth
              />
              <Button variant="contained" onClick={() => startMutation.mutate()} disabled={isPending || !userId.trim()}>
                Start
              </Button>
            </Stack>

            {isPending ? <CircularProgress size={24} /> : null}
            {error ? (
              <Alert severity="error">
                {error instanceof Error ? error.message : 'Неизвестная ошибка'}
              </Alert>
            ) : null}

            {state ? (
              <>
                <Alert severity="info">{buildStateSummary(state)}</Alert>
                <LearningActivityView activity={state.currentActivity} />

                {state.currentActivity.type === 'LEARNING_CARD' ? (
                  <Button variant="contained" onClick={() => continueMutation.mutate()} disabled={isPending}>
                    Продолжить
                  </Button>
                ) : null}

                {canSubmitInput ? (
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Ответ"
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      fullWidth
                    />
                    <Button variant="contained" onClick={handleSubmit} disabled={isPending || !input.trim()}>
                      Submit
                    </Button>
                  </Stack>
                ) : null}
              </>
            ) : (
              <Typography color="text.secondary">Нажмите Start, чтобы начать обучение.</Typography>
            )}
          </Stack>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Raw JSON</Typography>
          <Box component="pre" sx={{ overflow: 'auto', fontSize: 12, mt: 1 }}>
            {state ? JSON.stringify(state, null, 2) : 'Нет состояния'}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
