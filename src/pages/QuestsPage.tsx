import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import { Box, Button, Divider, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { chooseQuestOption, getMyQuestSessions, getQuests, proceedQuestSession, restartQuestSession, startQuest, uploadQuestFile } from '../api/questApi';
import type { QuestGameView, QuestSessionSnapshot, QuestSummary } from '../types/quest';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from '../components/ui';

export function QuestsPage() {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [sessions, setSessions] = useState<QuestSessionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestId, setCurrentQuestId] = useState<string | null>(null);
  const [game, setGame] = useState<QuestGameView | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const loadQuests = async () => {
    try {
      setLoading(true);
      setError(null);
      const [questList, sessionList] = await Promise.all([getQuests(), getMyQuestSessions()]);
      setQuests(questList);
      setSessions(sessionList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuests();
  }, []);

  const handleStartQuest = async (questId: string) => {
    try {
      setBusy(true);
      setError(null);
      const response = await startQuest(questId);
      setSessionId(response.sessionId);
      setCurrentQuestId(questId);
      setGame(response.game);
      setShowCatalog(false);
      setSessions(await getMyQuestSessions());
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
      setSessions(await getMyQuestSessions());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to choose option');
    } finally {
      setBusy(false);
    }
  };

  const handleProceed = async (targetSessionId: string) => {
    try {
      setBusy(true);
      setError(null);
      const response = await proceedQuestSession(targetSessionId);
      const targetSession = sessions.find((item) => item.sessionId === targetSessionId);
      setSessionId(response.sessionId);
      setCurrentQuestId(targetSession?.questId ?? null);
      setGame(response.game);
      setShowCatalog(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to proceed session');
    } finally {
      setBusy(false);
    }
  };

  const handleRestart = async () => {
    if (!sessionId) return;
    try {
      setBusy(true);
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
      setError(e instanceof Error ? e.message : 'Failed to restart quest');
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please choose a .quest file first.');
      return;
    }
    try {
      setUploading(true);
      setUploadMessage(null);
      const uploaded = await uploadQuestFile(selectedFile);
      setUploadMessage(`Uploaded: ${uploaded.title} (${uploaded.id})`);
      setSelectedFile(null);
      await loadQuests();
      setShowCatalog(true);
    } catch (e) {
      setUploadMessage(e instanceof Error ? e.message : 'Failed to upload quest');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading quests..." />;
  }

  return (
    <Stack spacing={{ xs: 2, md: 2 }} sx={{ '& .MuiTypography-root': { fontSize: { xs: '1.15rem', md: '1rem' } } }}>
      <PageHeader title="Quests" subtitle="Interactive text adventures." />

      {error ? <ErrorState message={error} /> : null}

      {!game || showCatalog ? (
        <SectionCard title="Upload Quest File">
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
              <Button variant="outlined" component="label" disabled={uploading} fullWidth sx={{ maxWidth: { sm: 220 }, minHeight: { xs: 60, sm: 56 } }}>
                Select .quest
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
                Upload
              </Button>
              <Typography variant="body1" color="text.secondary" sx={{ overflowWrap: 'anywhere', fontSize: { xs: '1.1rem', sm: '0.95rem' } }}>
                {selectedFile ? selectedFile.name : 'No file selected'}
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

      {!game || showCatalog ? (
        <SectionCard title="Available Quests">
          {!quests.length ? <EmptyState message="No quests available." /> : null}
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
                    disabled={busy}
                    fullWidth
                    sx={{ maxWidth: { sm: 160 }, minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
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
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={2}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.35rem', md: '1.05rem' } }}>{game.nodeTitle}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '1.05rem', md: '0.85rem' } }}>
                    {game.nodeId}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    minHeight: { xs: 300, md: 180 },
                    backgroundColor: 'background.default',
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
                      disabled={busy || game.finished}
                      sx={{ justifyContent: 'flex-start', minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.1rem', md: '0.95rem' }, py: { xs: 1.2, sm: 1 } }}
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

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="text"
                    startIcon={<RefreshRoundedIcon fontSize="small" />}
                    disabled={busy}
                    onClick={handleRestart}
                    fullWidth
                    sx={{ minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
                  >
                    Restart
                  </Button>
                  <Button variant="text" disabled={busy} onClick={() => setShowCatalog(true)} fullWidth sx={{ minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}>
                    Back to quests
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={1.5}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <Inventory2RoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Inventory</Typography>
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
                      Empty
                    </Typography>
                  )}
                </Box>

                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <MemoryRoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">Variables</Typography>
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
                      No variables
                    </Typography>
                  )}
                </Box>

              </Stack>
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {!game || showCatalog ? (
        <SectionCard title="My Quest Sessions">
          {!sessions.length ? <EmptyState message="No quest sessions yet." /> : null}
          <Stack spacing={1.5}>
            {sessions.map((session) => (
              <Box key={session.sessionId} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.75, md: 1.5 } }}>
                <Stack spacing={0.75}>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '1.25rem', md: '1rem' } }}>{session.questTitle || session.questId}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                    session: {session.sessionId}
                  </Typography>
                  <Typography variant="body2">
                    status: {session.status}
                  </Typography>
                  <Typography variant="body2">
                    currentNodeId: {session.gameState.currentNodeId}
                  </Typography>
                  <Typography variant="body2">
                    facts: {session.gameState.facts.join(', ') || '-'}
                  </Typography>
                  <Typography variant="body2">
                    inventory: {session.gameState.inventory.join(', ') || '-'}
                  </Typography>
                  <Typography variant="body2">
                    visitedNodes: {session.gameState.visitedNodes.join(', ') || '-'}
                  </Typography>
                  <Typography variant="body2">
                    navigationHistory: {session.gameState.navigationHistory.join(' -> ') || '-'}
                  </Typography>
                  <Typography variant="body2">
                    variables:
                  </Typography>
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
                      disabled={busy}
                      onClick={() => handleProceed(session.sessionId)}
                      fullWidth
                      sx={{ maxWidth: { sm: 160 }, minHeight: { xs: 60, sm: 56 }, fontSize: { xs: '1.05rem', md: '1rem' } }}
                    >
                      Proceed
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}
