import { Alert, Checkbox, Divider, FormControlLabel, Grid, MenuItem, Radio, Select, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearningActivityView } from '../components/LearningActivityView';
import {
  ActionButton,
  EmptyState,
  ErrorState,
  InfoCard,
  LoadingState,
  PageHeader,
  ProgressCard,
  SectionCard,
  StatusChip,
} from '../components/ui';
import {
  useContinueLearning,
  useLearningState,
  useStartLearning,
  useSubmitAnswer,
  useSubmitPractice,
  useSubmitQuickCheck,
  useSubmitRetry,
} from '../hooks/useLearning';
import { useGoal, useGoalProgram } from '../hooks/useGoals';
import { useCurrentProgram } from '../hooks/useProgram';
import { spacing } from '../theme/tokens';
import type { LearningState, PracticeItemView, QuickCheckActivity, RetryActivity } from '../types/learning';

function getActivityTitle(state: LearningState | undefined): string {
  if (!state) return 'NO_SESSION';
  return state.currentActivity.type.replace('_', ' ');
}

function isSupportedStructuredType(type: string): boolean {
  return type === 'TRUE_FALSE'
    || type === 'MULTIPLE_CHOICE'
    || type === 'MULTI_SELECT'
    || type === 'ORDERING'
    || type === 'MATCHING';
}

export function LearningPage() {
  const navigate = useNavigate();
  const [practiceBooleanAnswer, setPracticeBooleanAnswer] = useState<boolean | null>(null);
  const [practiceSelectedOptions, setPracticeSelectedOptions] = useState<number[]>([]);
  const [orderedOptions, setOrderedOptions] = useState<number[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, number>>({});
  const [activeGoalId, setActiveGoalId] = useState(() => {
    const raw = localStorage.getItem('active-goal-id');
    if (!raw) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });

  const learningStateQuery = useLearningState();
  const currentProgramQuery = useCurrentProgram();
  const goalQuery = useGoal(activeGoalId);
  const goalProgramQuery = useGoalProgram(activeGoalId);
  const startMutation = useStartLearning();
  const submitAnswerMutation = useSubmitAnswer();
  const continueMutation = useContinueLearning();
  const practiceMutation = useSubmitPractice();
  const quickCheckMutation = useSubmitQuickCheck();
  const retryMutation = useSubmitRetry();

  const state = learningStateQuery.data;
  const program = goalProgramQuery.data ?? currentProgramQuery.data;
  const activeGoal = goalQuery.data;

  useEffect(() => {
    if (activeGoalId <= 0) return;
    if (goalQuery.isSuccess && goalQuery.data === null) {
      localStorage.removeItem('active-goal-id');
      setActiveGoalId(0);
    }
  }, [activeGoalId, goalQuery.data, goalQuery.isSuccess]);

  const isPending =
    learningStateQuery.isLoading
    || currentProgramQuery.isLoading
    || goalProgramQuery.isLoading
    || goalQuery.isLoading
    || startMutation.isPending
    || submitAnswerMutation.isPending
    || continueMutation.isPending
    || practiceMutation.isPending
    || quickCheckMutation.isPending
    || retryMutation.isPending;

  const error =
    learningStateQuery.error
    ?? currentProgramQuery.error
    ?? goalProgramQuery.error
    ?? goalQuery.error
    ?? startMutation.error
    ?? submitAnswerMutation.error;

  const currentStructuredItem = useMemo(() => {
    if (!state) return null;
    if (state.currentActivity.type === 'PRACTICE') {
      const index = (state.currentActivity.currentItem ?? 1) - 1;
      if (index < 0 || index >= state.currentActivity.items.length) return null;
      return state.currentActivity.items[index];
    }
    if (state.currentActivity.type === 'QUICK_CHECK') {
      const activity = state.currentActivity as QuickCheckActivity;
      if (!activity.questionType) return null;
      return {
        type: activity.questionType,
        question: activity.question,
        options: activity.options ?? [],
        leftItems: activity.leftItems ?? [],
        rightItems: activity.rightItems ?? [],
      } as PracticeItemView;
    }
    if (state.currentActivity.type === 'RETRY') {
      const activity = state.currentActivity as RetryActivity;
      if (!activity.questionType) return null;
      return {
        type: activity.questionType,
        question: activity.question,
        options: activity.options ?? [],
        leftItems: activity.leftItems ?? [],
        rightItems: activity.rightItems ?? [],
      } as PracticeItemView;
    }
    return null;
  }, [state]);

  useEffect(() => {
    setPracticeBooleanAnswer(null);
    setPracticeSelectedOptions([]);
    setOrderedOptions([]);
    setMatchingAnswers({});
  }, [currentStructuredItem?.type, currentStructuredItem?.question]);

  useEffect(() => {
    if (!currentStructuredItem || currentStructuredItem.type !== 'ORDERING') return;
    if (orderedOptions.length === currentStructuredItem.options.length) return;
    setOrderedOptions(currentStructuredItem.options.map((_, index) => index));
  }, [currentStructuredItem, orderedOptions.length]);

  const canSubmitStructured = useMemo(() => {
    if (!currentStructuredItem) return false;
    if (!isSupportedStructuredType(currentStructuredItem.type)) return false;
    if (currentStructuredItem.type === 'TRUE_FALSE') return practiceBooleanAnswer !== null;
    if (currentStructuredItem.type === 'MULTIPLE_CHOICE') return practiceSelectedOptions.length === 1;
    if (currentStructuredItem.type === 'MULTI_SELECT') return practiceSelectedOptions.length > 0;
    if (currentStructuredItem.type === 'ORDERING') return orderedOptions.length === currentStructuredItem.options.length;
    if (currentStructuredItem.type === 'MATCHING') return currentStructuredItem.leftItems.every((_, i) => matchingAnswers[i] !== undefined);
    return false;
  }, [currentStructuredItem, practiceBooleanAnswer, practiceSelectedOptions, orderedOptions, matchingAnswers]);

  const handleSubmit = async () => {
    if (!state) return;
    if (state.currentActivity.type === 'QUESTION') {
      await submitAnswerMutation.mutateAsync('');
      return;
    }
    if (
      state.currentActivity.type === 'PRACTICE'
      || state.currentActivity.type === 'QUICK_CHECK'
      || state.currentActivity.type === 'RETRY'
    ) {
      const payload = {
        booleanAnswer: practiceBooleanAnswer,
        selectedOptions: practiceSelectedOptions,
        orderedOptions,
        matches: matchingAnswers,
      };
      if (state.currentActivity.type === 'PRACTICE') {
        await practiceMutation.mutateAsync(payload);
      } else if (state.currentActivity.type === 'QUICK_CHECK') {
        await quickCheckMutation.mutateAsync(payload);
      } else {
        await retryMutation.mutateAsync(payload);
      }
    }
  };

  const clearActiveGoal = () => {
    localStorage.removeItem('active-goal-id');
    setActiveGoalId(0);
  };

  return (
    <Grid container spacing={spacing.section}>
      <Grid size={{ xs: 12, lg: 8.5 }}>
        <Stack spacing={spacing.section}>
          <PageHeader
            title="Learning"
            subtitle="Current learning session"
            actions={<StatusChip label={getActivityTitle(state)} tone={state ? 'info' : 'default'} />}
          />

          <SectionCard title="Context">
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12 }}>
                <InfoCard
                  label="Active Goal"
                  value={activeGoal?.title ?? (activeGoalId > 0 ? `Goal #${activeGoalId}` : 'None')}
                  hint={activeGoalId > 0 ? `Goal ID: ${activeGoalId}` : 'Select and start a goal on the Goals page.'}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                  <ActionButton aria-label="Go to goals" onClick={() => navigate('/goals')}>
                    Goals
                  </ActionButton>
                  <ActionButton aria-label="Clear active goal" onClick={clearActiveGoal}>
                    Clear Active Goal
                  </ActionButton>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <InfoCard
                  label="Path"
                  value={`${activeGoal?.title ?? program?.goalTitle ?? 'Goal'} -> ${program?.title ?? 'Program'} -> ${state?.context.conceptName ?? 'Concept'} -> ${state?.context.microConceptName ?? 'Micro Concept'}`}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Topic" value={state?.context.topicName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Concept" value={state?.context.conceptName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard label="Micro Concept" value={state?.context.microConceptName ?? '-'} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <InfoCard
                  label="Progress"
                  value={`${state?.progress.conceptOrder ?? 0}/${state?.progress.totalConcepts ?? 0}`}
                  hint={`Answers: ${state?.progress.answeredCount ?? 0}`}
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Current Activity">
            {isPending ? <LoadingState message="Loading learning state..." /> : null}
            {error ? <ErrorState message={error instanceof Error ? error.message : 'Unexpected error'} /> : null}
            {!state && !isPending && !error ? <EmptyState message="Press Start to begin learning." /> : null}
            {state ? <LearningActivityView activity={state.currentActivity} /> : null}
          </SectionCard>

          <SectionCard title="Actions">
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <ActionButton aria-label="Start learning" onClick={() => startMutation.mutate()} disabled={isPending}>
                  Start
                </ActionButton>
              </Stack>

              <Divider />

              {state?.currentActivity.type === 'LEARNING_CARD' ? (
                <ActionButton aria-label="Continue learning" onClick={() => continueMutation.mutate()} disabled={isPending}>
                  Continue
                </ActionButton>
              ) : null}

              {state?.currentActivity.type === 'QUESTION' ? (
                <ActionButton aria-label="Continue from question" onClick={() => void handleSubmit()} disabled={isPending}>
                  Continue
                </ActionButton>
              ) : null}

              {(
                state?.currentActivity.type === 'PRACTICE'
                || state?.currentActivity.type === 'QUICK_CHECK'
                || state?.currentActivity.type === 'RETRY'
              ) && currentStructuredItem ? (
                <Stack spacing={1.5}>
                  {currentStructuredItem.type === 'TRUE_FALSE' ? (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <ActionButton aria-label="Answer True" onClick={() => setPracticeBooleanAnswer(true)} disabled={isPending}>
                        True
                      </ActionButton>
                      <ActionButton aria-label="Answer False" onClick={() => setPracticeBooleanAnswer(false)} disabled={isPending}>
                        False
                      </ActionButton>
                    </Stack>
                  ) : null}

                  {currentStructuredItem.type === 'MULTIPLE_CHOICE' ? (
                    <Stack spacing={0.5}>
                      {currentStructuredItem.options.map((option, index) => (
                        <FormControlLabel
                          key={`${index}-${option}`}
                          control={(
                            <Radio
                              checked={practiceSelectedOptions.includes(index)}
                              onChange={() => setPracticeSelectedOptions([index])}
                            />
                          )}
                          label={option}
                        />
                      ))}
                    </Stack>
                  ) : null}

                  {currentStructuredItem.type === 'MULTI_SELECT' ? (
                    <Stack spacing={0.5}>
                      {currentStructuredItem.options.map((option, index) => (
                        <FormControlLabel
                          key={`${index}-${option}`}
                          control={(
                            <Checkbox
                              checked={practiceSelectedOptions.includes(index)}
                              onChange={(event) => {
                                setPracticeSelectedOptions((prev) => {
                                  if (event.target.checked) return [...prev, index];
                                  return prev.filter((value) => value !== index);
                                });
                              }}
                            />
                          )}
                          label={option}
                        />
                      ))}
                    </Stack>
                  ) : null}

                  {currentStructuredItem.type === 'ORDERING' ? (
                    <Stack spacing={1}>
                      {orderedOptions.map((optionIndex, orderIndex, currentOrder) => (
                        <Stack key={`order-${optionIndex}`} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography sx={{ minWidth: 24 }}>{orderIndex + 1}.</Typography>
                          <Typography sx={{ flex: 1 }}>{currentStructuredItem.options[optionIndex]}</Typography>
                          <ActionButton
                            aria-label={`Move up ${orderIndex}`}
                            disabled={isPending || orderIndex === 0}
                            onClick={() => {
                              const next = [...currentOrder];
                              [next[orderIndex - 1], next[orderIndex]] = [next[orderIndex], next[orderIndex - 1]];
                              setOrderedOptions(next);
                            }}
                          >
                            ↑
                          </ActionButton>
                          <ActionButton
                            aria-label={`Move down ${orderIndex}`}
                            disabled={isPending || orderIndex === currentOrder.length - 1}
                            onClick={() => {
                              const next = [...currentOrder];
                              [next[orderIndex + 1], next[orderIndex]] = [next[orderIndex], next[orderIndex + 1]];
                              setOrderedOptions(next);
                            }}
                          >
                            ↓
                          </ActionButton>
                        </Stack>
                      ))}
                    </Stack>
                  ) : null}

                  {currentStructuredItem.type === 'MATCHING' ? (
                    <Stack spacing={1}>
                      {currentStructuredItem.leftItems.map((leftItem, leftIndex) => (
                        <Stack key={`match-${leftIndex}`} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                          <Typography sx={{ flex: 1 }}>{leftItem}</Typography>
                          <Select<string | number>
                            value={matchingAnswers[leftIndex] ?? ''}
                            onChange={(event) => {
                              const value = event.target.value as string | number;
                              if (value === '') {
                                setMatchingAnswers((prev) => {
                                  const next = { ...prev };
                                  delete next[leftIndex];
                                  return next;
                                });
                                return;
                              }
                              setMatchingAnswers((prev) => ({ ...prev, [leftIndex]: Number(value) }));
                            }}
                            size="small"
                            sx={{ minWidth: 240 }}
                          >
                            <MenuItem value="">Select match</MenuItem>
                            {currentStructuredItem.rightItems.map((rightItem, rightIndex) => (
                              <MenuItem key={`right-${leftIndex}-${rightIndex}`} value={rightIndex}>
                                {rightItem}
                              </MenuItem>
                            ))}
                          </Select>
                        </Stack>
                      ))}
                    </Stack>
                  ) : null}

                  {!isSupportedStructuredType(currentStructuredItem.type) ? (
                    <Alert severity="error">
                      Unsupported activity type: {currentStructuredItem.type}
                    </Alert>
                  ) : null}

                  <ActionButton aria-label="Submit structured answer" onClick={() => void handleSubmit()} disabled={isPending || !canSubmitStructured}>
                    Submit
                  </ActionButton>
                </Stack>
              ) : null}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 3.5 }}>
        <Stack spacing={spacing.section}>
          <ProgressCard
            title="Concept Progress"
            current={state?.progress.conceptOrder ?? null}
            total={state?.progress.totalConcepts ?? null}
          />
          <ProgressCard
            title="Micro Concept Progress"
            current={state?.progress.microConceptOrder ?? null}
            total={state?.progress.totalMicroConcepts ?? null}
          />
          <InfoCard label="Next Step" value={state?.currentActivity.type ?? 'Start'} />
          <InfoCard label="Session ID" value={state?.sessionId ?? '-'} hint={`Schema v${state?.schemaVersion ?? '-'}`} />
        </Stack>
      </Grid>
    </Grid>
  );
}
