import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { chooseQuestOption, getQuestSession, getQuests, startQuest } from '../api/questApi';
import type { QuestGameView, QuestSummary } from '../types/quest';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from '../components/ui';

const QUEST_SESSION_ID_KEY = 'quest-session-id';

export function QuestsPage() {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [game, setGame] = useState<QuestGameView | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [questList] = await Promise.all([getQuests()]);
        setQuests(questList);

        const savedSessionId = localStorage.getItem(QUEST_SESSION_ID_KEY);
        if (savedSessionId) {
          try {
            const savedGame = await getQuestSession(savedSessionId);
            setSessionId(savedSessionId);
            setGame(savedGame);
          } catch {
            localStorage.removeItem(QUEST_SESSION_ID_KEY);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load quests');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleStartQuest = async (questId: string) => {
    try {
      setBusy(true);
      setError(null);
      const response = await startQuest(questId);
      setSessionId(response.sessionId);
      setGame(response.game);
      localStorage.setItem(QUEST_SESSION_ID_KEY, response.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start quest');
    } finally {
      setBusy(false);
    }
  };

  const handleChoose = async (optionId: string) => {
    if (!sessionId) return;
    try {
      setBusy(true);
      setError(null);
      const nextGame = await chooseQuestOption(sessionId, optionId);
      setGame(nextGame);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to choose option');
    } finally {
      setBusy(false);
    }
  };

  const handleRestart = async () => {
    if (!game) return;
    const quest = quests.find((item) => item.title === game.title) ?? quests[0];
    if (!quest) return;
    await handleStartQuest(quest.id);
  };

  if (loading) {
    return <LoadingState message="Loading quests..." />;
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="Quests" subtitle="Interactive text adventures." />

      {error ? <ErrorState message={error} /> : null}

      {!game ? (
        <SectionCard title="Available Quests">
          {!quests.length ? <EmptyState message="No quests available." /> : null}
          <Stack spacing={1.5}>
            {quests.map((quest) => (
              <Box
                key={quest.id}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AutoStoriesRoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">{quest.title}</Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStartQuest(quest.id)}
                    disabled={busy}
                  >
                    Start
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      ) : (
        <SectionCard title={game.title}>
          <Stack spacing={2}>
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                minHeight: 160,
                backgroundColor: '#111827',
              }}
            >
              <Typography variant="body1" sx={{ color: '#f3f4f6', whiteSpace: 'pre-wrap' }}>
                {game.text}
              </Typography>
            </Box>

            <Stack spacing={1}>
              {game.options.map((option) => (
                <Button
                  key={option.id}
                  variant="outlined"
                  onClick={() => handleChoose(option.id)}
                  disabled={busy || game.finished}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {option.text}
                </Button>
              ))}
              {!game.options.length ? (
                <Typography variant="body2" color="text.secondary">
                  Quest finished.
                </Typography>
              ) : null}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="text"
                startIcon={<RefreshRoundedIcon fontSize="small" />}
                disabled={busy}
                onClick={handleRestart}
              >
                Restart
              </Button>
            </Stack>
          </Stack>
        </SectionCard>
      )}
    </Stack>
  );
}
