import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import { Box, Button, Divider, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { chooseQuestOption, getQuestMap, getQuestSession, getQuests, goBackQuest, startQuest, uploadQuestFile } from '../api/questApi';
import type { QuestGameView, QuestMapView, QuestSummary } from '../types/quest';
import { WorldMap } from '../components/quest/WorldMap';
import { EmptyState, ErrorState, LoadingState, PageHeader, SectionCard } from '../components/ui';

const QUEST_SESSION_ID_KEY = 'quest-session-id';

export function QuestsPage() {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [game, setGame] = useState<QuestGameView | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [worldMap, setWorldMap] = useState<QuestMapView | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const loadQuests = async (includeSavedSession: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const [questList] = await Promise.all([getQuests()]);
      setQuests(questList);

      if (includeSavedSession) {
        const savedSessionId = localStorage.getItem(QUEST_SESSION_ID_KEY);
        if (savedSessionId) {
          try {
            const savedGame = await getQuestSession(savedSessionId);
            const savedMap = await getQuestMap(savedSessionId);
            setSessionId(savedSessionId);
            setGame(savedGame);
            setWorldMap(savedMap);
            setShowCatalog(true);
          } catch {
            localStorage.removeItem(QUEST_SESSION_ID_KEY);
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuests(true);
  }, []);

  const handleStartQuest = async (questId: string) => {
    try {
      setBusy(true);
      setError(null);
      const response = await startQuest(questId);
      const map = await getQuestMap(response.sessionId);
      setSessionId(response.sessionId);
      setGame(response.game);
      setWorldMap(map);
      setShowCatalog(false);
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
      const map = await getQuestMap(sessionId);
      setGame(nextGame);
      setWorldMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to choose option');
    } finally {
      setBusy(false);
    }
  };

  const handleBack = async () => {
    if (!sessionId) return;
    try {
      setBusy(true);
      setError(null);
      const previousGame = await goBackQuest(sessionId);
      const map = await getQuestMap(sessionId);
      setGame(previousGame);
      setWorldMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to go back');
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
      await loadQuests(false);
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
    <Stack spacing={2}>
      <PageHeader title="Quests" subtitle="Interactive text adventures." />

      {error ? <ErrorState message={error} /> : null}

      {!game || showCatalog ? (
        <SectionCard title="Upload Quest File">
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
              <Button variant="outlined" component="label" disabled={uploading}>
                Select .quest
                <input hidden type="file" accept=".quest,text/plain" onChange={handleFileChange} />
              </Button>
              <Button
                variant="contained"
                startIcon={<FileUploadRoundedIcon fontSize="small" />}
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                Upload
              </Button>
              <Typography variant="body2" color="text.secondary">
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
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={2}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Typography variant="subtitle2">{game.nodeTitle}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {game.nodeId}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    minHeight: 180,
                    backgroundColor: 'background.default',
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
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
                    startIcon={<KeyboardBackspaceRoundedIcon fontSize="small" />}
                    disabled={busy || !game.canGoBack}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<RefreshRoundedIcon fontSize="small" />}
                    disabled={busy}
                    onClick={handleRestart}
                  >
                    Restart
                  </Button>
                  <Button variant="text" disabled={busy} onClick={() => setShowCatalog(true)}>
                    Back to quests
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={1.5}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
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

                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
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

                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <MapRoundedIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle2">World Map</Typography>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  <Box sx={{ height: { xs: 320, md: 460 }, minHeight: 320, maxHeight: 520 }}>
                    <WorldMap
                      currentNodeId={worldMap?.currentNodeId ?? game.nodeId}
                      visited={worldMap?.visited ?? game.visitedNodes}
                      available={worldMap?.available ?? []}
                      onNodeClick={(nodeId) => {
                        const mappedOption = game.options.find((option) => option.id === nodeId);
                        if (mappedOption && worldMap?.available.includes(nodeId)) {
                          void handleChoose(mappedOption.id);
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </SectionCard>
      )}

      {game && showCatalog ? (
        <SectionCard title={`Current Quest: ${game.title}`}>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => setShowCatalog(false)}>
              Return to game
            </Button>
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}
