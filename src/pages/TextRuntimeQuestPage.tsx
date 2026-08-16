import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  executeActionTextRuntime,
  exportTextRuntimeQuest,
  generateActionsTextRuntime,
  generateSceneTextRuntime,
  generationStatusTextRuntime,
  inspectTargetTextRuntime,
  inspectTextRuntime,
  interactTextRuntime,
  moveTextRuntime,
  startTextRuntimeQuest,
  takeTextRuntime,
  useTextRuntime,
  type RuntimeGenerationStatus,
  type RuntimeItem,
  type RuntimeObjective,
  type RuntimeSnapshot,
} from '../api/textRuntimeApi';
import { SectionCard } from '../components/ui';

export function TextRuntimeQuestPage() {
  const { questId = '' } = useParams();
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [status, setStatus] = useState<RuntimeGenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [activeDialogueNpcId, setActiveDialogueNpcId] = useState<string | null>(null);
  const [dialogueText, setDialogueText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setPending(true);
        setError(null);
        const started = await startTextRuntimeQuest(questId);
        if (cancelled) return;
        setSnapshot(started);
        setStatus(await generateActionsTextRuntime(started.sessionId));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to open quest');
      } finally {
        if (!cancelled) setPending(false);
      }
    };
    if (questId) void run();
    return () => {
      cancelled = true;
    };
  }, [questId]);

  const inventory: RuntimeItem[] = useMemo(() => snapshot?.inventory ?? [], [snapshot]);

  const applicableTargets = useMemo(() => {
    if (!snapshot || !selectedInventoryItem) return [];
    return snapshot.availableActions
      .filter((a) => (a.requiredItems ?? []).some((item) => item === selectedInventoryItem))
      .filter((a) => a.targetId)
      .map((a) => ({ id: a.id, label: a.description || a.id, targetId: a.targetId as string }));
  }, [snapshot, selectedInventoryItem]);

  const dialogueActionGroups = useMemo(() => {
    const map = new Map<string, Array<{ id: string; description: string }>>();
    for (const action of snapshot?.availableActions ?? []) {
      if (!action.id?.startsWith('dialogue:')) continue;
      const parts = action.id.split(':');
      if (parts.length < 3 || !parts[1]) continue;
      const npcId = parts[1];
      const option = { id: action.id, description: action.description || action.id };
      map.set(npcId, [...(map.get(npcId) ?? []), option]);
    }
    return map;
  }, [snapshot]);

  useEffect(() => {
    if (activeDialogueNpcId && dialogueActionGroups.has(activeDialogueNpcId)) return;
    const firstNpcWithDialogue = Array.from(dialogueActionGroups.keys())[0] ?? null;
    setActiveDialogueNpcId(firstNpcWithDialogue);
    if (!firstNpcWithDialogue) {
      setDialogueText(null);
    }
  }, [activeDialogueNpcId, dialogueActionGroups]);

  const refresh = async () => {
    if (!snapshot?.sessionId) return;
    setPending(true);
    try {
      setSnapshot(await inspectTextRuntime(snapshot.sessionId));
      setStatus(await generateActionsTextRuntime(snapshot.sessionId));
    } finally {
      setPending(false);
    }
  };

  const generateScene = async () => {
    if (!snapshot?.sessionId) return;
    setPending(true);
    try {
      setStatus(await generateSceneTextRuntime(snapshot.sessionId));
    } finally {
      setPending(false);
    }
  };

  const exportQuest = async () => {
    if (!questId) return;
    setPending(true);
    try {
      await exportTextRuntimeQuest(questId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export quest');
    } finally {
      setPending(false);
    }
  };

  const move = async (locationId: string | null) => {
    if (!snapshot?.sessionId || !locationId) return;
    setPending(true);
    try {
      setSnapshot(await moveTextRuntime(snapshot.sessionId, locationId));
      setResultText(null);
      setDialogueText(null);
      setActiveDialogueNpcId(null);
      setStatus(await generationStatusTextRuntime(snapshot.sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Move is not available');
    } finally {
      setPending(false);
    }
  };

  const take = async (itemId: string) => {
    if (!snapshot?.sessionId) return;
    setPending(true);
    try {
      setSnapshot(await takeTextRuntime(snapshot.sessionId, itemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to take item');
    } finally {
      setPending(false);
    }
  };

  const interact = async (customTarget?: string) => {
    if (!snapshot?.sessionId) return;
    const target = (customTarget ?? targetId).trim();
    if (!target) return;
    setPending(true);
    try {
      const result = await interactTextRuntime(snapshot.sessionId, target);
      setSnapshot(result.snapshot);
      setTargetId(target);
      const npcExists = (result.snapshot.npcs ?? []).some((npc) => npc.id === target);
      if (npcExists) {
        setActiveDialogueNpcId(target);
        setDialogueText(result.message);
      }
      setResultText(`${result.message}\nEngine action: ${result.engineAction}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute action');
    } finally {
      setPending(false);
    }
  };

  const runGeneratedAction = async (actionId: string, targetId: string | null) => {
    if (!snapshot?.sessionId) return;
    setPending(true);
    try {
      if (actionId.startsWith('move:')) {
        if (!(targetId ?? '').trim()) {
          throw new Error('Move target is not specified');
        }
        setSnapshot(await moveTextRuntime(snapshot.sessionId, (targetId ?? '').trim()));
        setStatus(await generateActionsTextRuntime(snapshot.sessionId));
        return;
      }
      if (actionId.startsWith('item:') || actionId.startsWith('npc:')) {
        if (!(targetId ?? '').trim()) {
          throw new Error('Interaction target is not specified');
        }
        const result = await interactTextRuntime(snapshot.sessionId, (targetId ?? '').trim());
        setSnapshot(result.snapshot);
        setStatus(await generateActionsTextRuntime(snapshot.sessionId));
        setResultText(`${result.message}\nEngine action: ${result.engineAction}`);
        return;
      }
      if (actionId.startsWith('dialogue:')) {
        const result = await interactTextRuntime(snapshot.sessionId, actionId);
        setSnapshot(result.snapshot);
        const parts = actionId.split(':');
        if (parts.length >= 3) {
          setActiveDialogueNpcId(parts[1]);
        }
        setDialogueText(result.message);
        setStatus(await generateActionsTextRuntime(snapshot.sessionId));
        setResultText(`${result.message}\nEngine action: ${result.engineAction}`);
        return;
      }
      setSnapshot(await executeActionTextRuntime(snapshot.sessionId, actionId));
      setStatus(await generateActionsTextRuntime(snapshot.sessionId));
      setResultText(`Engine action: executeAction:${actionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to execute generated action');
    } finally {
      setPending(false);
    }
  };

  const inspectTarget = async (customTarget?: string) => {
    if (!snapshot?.sessionId) return;
    const target = (customTarget ?? targetId).trim();
    if (!target) return;
    setPending(true);
    try {
      const description = await inspectTargetTextRuntime(snapshot.sessionId, target);
      setResultText(description);
      setTargetId(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to inspect target');
    } finally {
      setPending(false);
    }
  };

  const useItemOnTarget = async (customTarget?: string) => {
    if (!snapshot?.sessionId || !selectedInventoryItem) return;
    const target = (customTarget ?? targetId).trim();
    if (!target) return;
    setPending(true);
    try {
      setSnapshot(await useTextRuntime(snapshot.sessionId, selectedInventoryItem, target));
      setResultText(`Used item ${selectedInventoryItem} on ${target}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to use item');
    } finally {
      setPending(false);
    }
  };

  const renderObjectives = (objectives: RuntimeObjective[], level = 0): ReactNode[] => objectives.flatMap((objective): ReactNode[] => {
    const row = (
      <Typography
        key={`${level}:${objective.id}`}
        variant="body2"
        sx={{ pl: level * 1.5 }}
      >
        {objective.completed ? '[x]' : '[ ]'} {objective.title}
      </Typography>
    );
    const description = objective.description ? (
      <Typography
        key={`${level}:${objective.id}:desc`}
        variant="caption"
        color="text.secondary"
        sx={{ pl: (level * 1.5) + 2 }}
      >
        {objective.description}
      </Typography>
    ) : null;
    const children: ReactNode[] = renderObjectives(objective.children ?? [], level + 1);
    return description ? [row, description, ...children] : [row, ...children];
  });

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Breadcrumbs>
        <MuiLink component={Link} to="/text-runtime" underline="hover" color="inherit">
          Text Runtime
        </MuiLink>
        <Typography color="text.primary">{questId}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Stack spacing={2}>
          <SectionCard title={snapshot ? `Scene ${snapshot.currentLocationId}` : 'Scene'}>
            <Stack spacing={1}>
              <Typography variant="body2">{snapshot?.description ?? 'No data'}</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => void refresh()} disabled={!snapshot || pending}>Refresh</Button>
                <Button size="small" variant="outlined" onClick={() => void generateScene()} disabled={!snapshot || pending}>Generate Scene</Button>
                <Button size="small" variant="outlined" onClick={() => void exportQuest()} disabled={!questId || pending}>Export</Button>
              </Stack>
              {status ? (
                <Typography variant="caption" color="text.secondary">
                  {`Scene: ${status.sceneGenerated ? 'ready' : 'no'} | Actions: ${status.actionsGenerated ? 'ready' : 'no'}`}
                </Typography>
              ) : null}
            </Stack>
          </SectionCard>

          <SectionCard title="Actions">
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">Generated actions</Typography>
              {(status?.generatedActions ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No available actions for the current scene.</Typography>
              ) : null}
              {(status?.generatedActions ?? []).map((action) => (
                <Button
                  key={action.id}
                  size="small"
                  variant="outlined"
                  disabled={pending || (!action.targetId && !action.id)}
                  onClick={() => void runGeneratedAction(action.id, action.targetId)}
                >
                  {action.label}
                </Button>
              ))}

              {resultText ? <Alert severity="info" sx={{ whiteSpace: 'pre-line' }}>{resultText}</Alert> : null}
            </Stack>
          </SectionCard>
        </Stack>

        <Stack spacing={2}>
          <SectionCard title="Use Item On">
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {inventory.map((item) => (
                  <Button
                    key={item.id}
                    size="small"
                    variant={selectedInventoryItem === item.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedInventoryItem(item.id)}
                  >
                    {item.name || item.id}
                  </Button>
                ))}
              </Stack>
              {selectedInventoryItem && applicableTargets.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No available targets for this item right now.</Typography>
              ) : null}
              {applicableTargets.map((target) => (
                <Button
                  key={`${target.id}:${target.targetId}`}
                  size="small"
                  variant="outlined"
                  onClick={() => void useItemOnTarget(target.targetId)}
                  disabled={pending}
                >
                  {`${target.label} (${target.targetId})`}
                </Button>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Dialogue">
            <Stack spacing={1}>
              {!activeDialogueNpcId ? (
                <Typography variant="body2" color="text.secondary">Dialogue is not active.</Typography>
              ) : (
                <>
                  <Typography variant="caption" color="text.secondary">NPC: {activeDialogueNpcId}</Typography>
                  <Typography variant="body2">{dialogueText ?? 'Click "Talk" to start dialogue.'}</Typography>
                  {(dialogueActionGroups.get(activeDialogueNpcId) ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No dialogue options available.</Typography>
                  ) : null}
                  {(dialogueActionGroups.get(activeDialogueNpcId) ?? []).map((option) => (
                    <Button
                      key={option.id}
                      size="small"
                      variant="contained"
                      onClick={() => void runGeneratedAction(option.id, option.id)}
                      disabled={pending}
                    >
                      {option.description}
                    </Button>
                  ))}
                </>
              )}
            </Stack>
          </SectionCard>

          <SectionCard title="Facts">
            <Stack spacing={0.5}>
              {(snapshot?.knownFacts ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No discovered facts yet.</Typography>
              ) : null}
              {(snapshot?.knownFacts ?? []).map((fact) => (
                <Typography key={fact} variant="body2">- {fact}</Typography>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Objectives">
            <Stack spacing={0.5}>
              {(snapshot?.objectives ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No objectives are defined for this quest.</Typography>
              ) : renderObjectives(snapshot?.objectives ?? [])}
            </Stack>
          </SectionCard>

          <SectionCard title="Object States">
            <Stack spacing={0.5}>
              {Object.keys(snapshot?.objectStates ?? {}).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No object state changes.</Typography>
              ) : null}
              {Object.entries(snapshot?.objectStates ?? {}).map(([key, value]) => (
                <Typography key={key} variant="body2">{`- ${key}: ${value}`}</Typography>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Character States">
            <Stack spacing={0.5}>
              {Object.keys(snapshot?.characterStates ?? {}).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No character state changes.</Typography>
              ) : null}
              {Object.entries(snapshot?.characterStates ?? {}).map(([key, value]) => (
                <Typography key={key} variant="body2">{`- ${key}: ${value}`}</Typography>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Transitions">
            <Stack spacing={1}>
              {(snapshot?.exits ?? []).map((exit, index) => (
                <Button key={`${exit.actionText}-${index}`} variant="outlined" onClick={() => void move(exit.targetLocationId)} disabled={pending || !exit.targetLocationId}>
                  {exit.actionText}
                </Button>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Items and NPCs">
            <Stack spacing={1}>
              {(snapshot?.items ?? []).map((item) => (
                <Stack direction="row" spacing={1} key={item.id}>
                  <Button size="small" variant="text" onClick={() => void take(item.id)} disabled={pending}>Take: {item.name || item.id}</Button>
                  <Button size="small" variant="outlined" onClick={() => void inspectTarget(item.id)} disabled={pending}>Inspect</Button>
                </Stack>
              ))}
              {(snapshot?.npcs ?? []).map((npc) => (
                <Stack direction="row" spacing={1} key={npc.id}>
                  <Button size="small" variant="contained" onClick={() => void interact(npc.id)} disabled={pending}>Talk: {npc.id}</Button>
                  <Button size="small" variant="outlined" onClick={() => void inspectTarget(npc.id)} disabled={pending}>Inspect</Button>
                </Stack>
              ))}
              {(snapshot?.objects ?? []).map((worldObject) => (
                <Stack direction="row" spacing={1} key={worldObject.id}>
                  <Button size="small" variant="outlined" onClick={() => void interact(worldObject.id)} disabled={pending}>Interact: {worldObject.id}</Button>
                  <Button size="small" variant="outlined" onClick={() => void inspectTarget(worldObject.id)} disabled={pending}>Inspect</Button>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}

