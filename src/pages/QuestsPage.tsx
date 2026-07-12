import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { chooseQuestOption, getMyQuestSessions, getQuests, proceedQuestSession, restartQuestSession, startQuest, uploadQuestFile } from '../api/questApi';
import type { QuestGameView, QuestSessionSnapshot, QuestSummary } from '../types/quest';
import { EmptyState, ErrorState, LoadingState, SectionCard } from '../components/ui';

export function QuestsPage() {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [sessions, setSessions] = useState<QuestSessionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestId, setCurrentQuestId] = useState<string | null>(null);
  const [game, setGame] = useState<QuestGameView | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [sessionsExpanded, setSessionsExpanded] = useState(false);

  const loadQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const [questList, sessionList] = await Promise.all([getQuests(), getMyQuestSessions()]);
      setQuests(questList);
      setSessions(sessionList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить квесты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuests();
  }, []);

  const handleStartQuest = async (questId: string) => {
    const actionKey = `start-${questId}`;
    try {
      setPendingAction(actionKey);
      setError(null);
      const response = await startQuest(questId);
      setSessionId(response.sessionId);
      setCurrentQuestId(questId);
      setGame(response.game);
      setShowCatalog(false);
      setSessions(await getMyQuestSessions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось начать квест');
    } finally {
      setPendingAction((prev) => (prev === actionKey ? null : prev));
    }
  };

  const handleChoose = async (optionId: string) => {
    if (!sessionId) return;
    const actionKey = `choose-${optionId}`;
    try {
      setPendingAction(actionKey);
      setError(null);
      const nextGame = await chooseQuestOption(sessionId, optionId);
      setGame(nextGame);
      setSessions(await getMyQuestSessions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выбрать действие');
    } finally {
      setPendingAction((prev) => (prev === actionKey ? null : prev));
    }
  };

  const handleProceed = async (targetSessionId: string) => {
    const actionKey = `proceed-${targetSessionId}`;
    try {
      setPendingAction(actionKey);
      setError(null);
      const response = await proceedQuestSession(targetSessionId);
      const targetSession = sessions.find((item) => item.sessionId === targetSessionId);
      setSessionId(response.sessionId);
      setCurrentQuestId(targetSession?.questId ?? null);
      setGame(response.game);
      setShowCatalog(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось продолжить сессию');
    } finally {
      setPendingAction((prev) => (prev === actionKey ? null : prev));
    }
  };

  const handleRestart = async () => {
    if (!sessionId) return;
    const actionKey = 'restart';
    try {
      setPendingAction(actionKey);
      setError(null);
      const response = await restartQuestSession(sessionId);
      setSessionId(response.sessionId);
      if (!currentQuestId) {
        const targetSession = sessions.find((item) => item.sessionId === sessionId);
        setCurrentQuestId(targetSession?.questId ?? null);
      }
      setGame(response.game);
      setSessions(await getMyQuestSessions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось перезапустить квест');
    } finally {
      setPendingAction((prev) => (prev === actionKey ? null : prev));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Сначала выберите файл .quest.');
      return;
    }
    try {
      setUploading(true);
      setUploadMessage(null);
      const uploaded = await uploadQuestFile(selectedFile);
      setUploadMessage(`Загружено: ${uploaded.title} (${uploaded.id})`);
      setSelectedFile(null);
      await loadQuests();
      setShowCatalog(true);
    } catch (e) {
      setUploadMessage(e instanceof Error ? e.message : 'Не удалось загрузить квест');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка квестов..." />;
  }

  return (
    <Stack spacing={{ xs: 2, md: 2 }} sx={{ '& .MuiTypography-root': { fontSize: { xs: '1.15rem', md: '1rem' } } }}>
      {error ? <ErrorState message={error} /> : null}

      {!game || showCatalog ? (
        <SectionCard title="Доступные квесты">
          {!quests.length ? <EmptyState message="Нет доступных квестов." /> : null}
          <Stack spacing={1.5}>
            {quests.map((quest) => (
              <Box
                key={quest.id}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <AutoStoriesRoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle1" sx={{ fontSize: { xs: '1.25rem', md: '1rem' } }}>{quest.title}</Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={() => handleStartQuest(quest.id)}
                    disabled={pendingAction === `start-${quest.id}`}
                    fullWidth
                    sx={{ maxWidth: { sm: 160 }, minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
                  >
                    Начать
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      ) : (
        <SectionCard>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={2}>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    minHeight: { xs: 300, md: 180 },
                    maxHeight: { xs: 300, md: 180 },
                    backgroundColor: 'background.default',
                    overflowY: 'auto',
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '1.25rem', md: '1rem' }, lineHeight: 1.7 }}>
                    {game.text}
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  {game.options.map((option) => (
                    <Button
                      key={option.id}
                      variant="outlined"
                      onClick={() => handleChoose(option.id)}
                      disabled={pendingAction === `choose-${option.id}` || game.finished}
                      sx={{ justifyContent: 'flex-start', minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.1rem', md: '0.95rem' }, py: { xs: 1.2, sm: 1 } }}
                    >
                      {option.text}
                    </Button>
                  ))}
                  {!game.options.length ? (
                    <Typography variant="body2" color="text.secondary">
                      Квест завершён.
                    </Typography>
                  ) : null}
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="text"
                    startIcon={<RefreshRoundedIcon fontSize="small" />}
                    disabled={pendingAction === 'restart'}
                    onClick={handleRestart}
                    fullWidth
                    sx={{ minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
                  >
                    Перезапустить
                  </Button>
                  <Button variant="text" onClick={() => setShowCatalog(true)} fullWidth sx={{ minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}>
                    К списку квестов
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={1.5}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <Inventory2RoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Инвентарь</Typography>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  {game.inventory.length ? (
                    <Stack spacing={0.75}>
                      {game.inventory.map((item) => (
                        <Typography key={item} variant="body2">
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Пусто
                    </Typography>
                  )}
                </Box>

                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <MemoryRoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Переменные</Typography>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  {Object.keys(game.variables).length ? (
                    <Stack spacing={0.75}>
                      {Object.entries(game.variables)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([name, value]) => (
                          <Typography key={name} variant="body2">
                            {name}: {value}
                          </Typography>
                        ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Нет переменных
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {!game || showCatalog ? (
        <SectionCard title="Мои сессии квестов">
          <Accordion expanded={sessionsExpanded} onChange={(_, expanded) => setSessionsExpanded(expanded)} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <Typography variant="subtitle1">Показать сессии ({sessions.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0 }}>
              {!sessions.length ? <EmptyState message="Сессий квестов пока нет." /> : null}
              <Stack spacing={1.5}>
                {sessions.map((session) => (
                  <Accordion key={session.sessionId} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'transparent' }}>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                      <Stack sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontSize: { xs: '1.15rem', md: '1rem' } }}>
                          {session.questTitle || session.questId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                          {session.status} • {session.sessionId}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={0.75}>
                        <Typography variant="body2">Текущий узел: {session.gameState.currentNodeId}</Typography>
                        <Typography variant="body2">Факты: {session.gameState.facts.join(', ') || '-'}</Typography>
                        <Typography variant="body2">Инвентарь: {session.gameState.inventory.join(', ') || '-'}</Typography>
                        <Typography variant="body2">Посещённые узлы: {session.gameState.visitedNodes.join(', ') || '-'}</Typography>
                        <Typography variant="body2">История переходов: {session.gameState.navigationHistory.join(' -> ') || '-'}</Typography>
                        <Typography variant="body2">Переменные:</Typography>
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: 'background.default',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: 13,
                          }}
                        >
                          {JSON.stringify(session.gameState.variables, null, 2)}
                        </Box>
                        <Stack direction="row" sx={{ justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={pendingAction === `proceed-${session.sessionId}`}
                            onClick={() => handleProceed(session.sessionId)}
                            fullWidth
                            sx={{ maxWidth: { sm: 160 }, minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
                          >
                            Продолжить
                          </Button>
                        </Stack>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </SectionCard>
      ) : null}

      {!game || showCatalog ? (
        <SectionCard title="Загрузка файла квеста">
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
              <Button variant="outlined" component="label" disabled={uploading} fullWidth sx={{ maxWidth: { sm: 220 }, minHeight: { xs: 60, sm: 56 } }}>
                Выбрать .quest
                <input hidden type="file" accept=".quest,text/plain" onChange={handleFileChange} />
              </Button>
              <Button
                variant="contained"
                startIcon={<FileUploadRoundedIcon fontSize="small" />}
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                fullWidth
                sx={{ maxWidth: { sm: 180 }, minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
              >
                Загрузить
              </Button>
              <Typography variant="body1" color="text.secondary" sx={{ overflowWrap: 'anywhere', fontSize: { xs: '1.1rem', sm: '0.95rem' } }}>
                {selectedFile ? selectedFile.name : 'Файл не выбран'}
              </Typography>
            </Stack>
            {uploadMessage ? (
              <Typography variant="body2" color="text.secondary">
                {uploadMessage}
              </Typography>
            ) : null}
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}
