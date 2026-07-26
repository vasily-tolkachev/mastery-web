import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
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
        setError(e instanceof Error ? e.message : 'Не удалось открыть квест');
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
      setError(e instanceof Error ? e.message : 'Не удалось экспортировать квест');
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
      setStatus(await generationStatusTextRuntime(snapshot.sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Переход недоступен');
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
      setError(e instanceof Error ? e.message : 'Не удалось взять предмет');
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
      setResultText(`${result.message}\nДействие движка: ${result.engineAction}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
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
          throw new Error('Цель перехода не указана');
        }
        setSnapshot(await moveTextRuntime(snapshot.sessionId, (targetId ?? '').trim()));
        setStatus(await generateActionsTextRuntime(snapshot.sessionId));
        return;
      }
      if (actionId.startsWith('item:') || actionId.startsWith('npc:')) {
        if (!(targetId ?? '').trim()) {
          throw new Error('Цель взаимодействия не указана');
        }
        const result = await interactTextRuntime(snapshot.sessionId, (targetId ?? '').trim());
        setSnapshot(result.snapshot);
        setStatus(await generateActionsTextRuntime(snapshot.sessionId));
        setResultText(`${result.message}\nДействие движка: ${result.engineAction}`);
        return;
      }
      setSnapshot(await executeActionTextRuntime(snapshot.sessionId, actionId));
      setStatus(await generateActionsTextRuntime(snapshot.sessionId));
      setResultText(`Действие движка: executeAction:${actionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить сгенерированное действие');
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
      setError(e instanceof Error ? e.message : 'Не удалось осмотреть цель');
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
      setResultText(`Использован предмет ${selectedInventoryItem} на ${target}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось использовать предмет');
    } finally {
      setPending(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Breadcrumbs>
        <MuiLink component={Link} to="/text-runtime" underline="hover" color="inherit">
          Текстовый режим
        </MuiLink>
        <Typography color="text.primary">{questId}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Stack spacing={2}>
          <SectionCard title={snapshot ? `Сцена ${snapshot.currentLocationId}` : 'Сцена'}>
            <Stack spacing={1}>
              <Typography variant="body2">{snapshot?.description ?? 'Нет данных'}</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => void refresh()} disabled={!snapshot || pending}>Обновить</Button>
                <Button size="small" variant="outlined" onClick={() => void generateScene()} disabled={!snapshot || pending}>Сгенерировать сцену</Button>
                <Button size="small" variant="outlined" onClick={() => void exportQuest()} disabled={!questId || pending}>Экспорт</Button>
              </Stack>
              {status ? (
                <Typography variant="caption" color="text.secondary">
                  {`Сцена: ${status.sceneGenerated ? 'готово' : 'нет'} | Действия: ${status.actionsGenerated ? 'готово' : 'нет'}`}
                </Typography>
              ) : null}
            </Stack>
          </SectionCard>

          <SectionCard title="Действия">
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">Сгенерированные действия</Typography>
              {(status?.generatedActions ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Нет доступных действий для текущей сцены.</Typography>
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
          <SectionCard title="Куда применить предмет">
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
                <Typography variant="body2" color="text.secondary">Для этого предмета сейчас нет доступных целей.</Typography>
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

          <SectionCard title="Факты">
            <Stack spacing={0.5}>
              {(snapshot?.knownFacts ?? []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Пока нет открытых фактов.</Typography>
              ) : null}
              {(snapshot?.knownFacts ?? []).map((fact) => (
                <Typography key={fact} variant="body2">• {fact}</Typography>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Состояния объектов">
            <Stack spacing={0.5}>
              {Object.keys(snapshot?.objectStates ?? {}).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Нет изменений состояний объектов.</Typography>
              ) : null}
              {Object.entries(snapshot?.objectStates ?? {}).map(([key, value]) => (
                <Typography key={key} variant="body2">{`• ${key}: ${value}`}</Typography>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Состояния персонажей">
            <Stack spacing={0.5}>
              {Object.keys(snapshot?.characterStates ?? {}).length === 0 ? (
                <Typography variant="body2" color="text.secondary">Нет изменений состояний персонажей.</Typography>
              ) : null}
              {Object.entries(snapshot?.characterStates ?? {}).map(([key, value]) => (
                <Typography key={key} variant="body2">{`• ${key}: ${value}`}</Typography>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Переходы">
            <Stack spacing={1}>
              {(snapshot?.exits ?? []).map((exit, index) => (
                <Button key={`${exit.actionText}-${index}`} variant="outlined" onClick={() => void move(exit.targetLocationId)} disabled={pending || !exit.targetLocationId}>
                  {exit.actionText}
                </Button>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Предметы и NPC">
            <Stack spacing={1}>
              {(snapshot?.items ?? []).map((item) => (
                <Stack direction="row" spacing={1} key={item.id}>
                  <Button size="small" variant="text" onClick={() => void take(item.id)} disabled={pending}>Взять: {item.name || item.id}</Button>
                  <Button size="small" variant="outlined" onClick={() => void inspectTarget(item.id)} disabled={pending}>Осмотреть</Button>
                </Stack>
              ))}
              {(snapshot?.npcs ?? []).map((npc) => (
                <Stack direction="row" spacing={1} key={npc.id}>
                  <Button size="small" variant="contained" onClick={() => void interact(npc.id)} disabled={pending}>Поговорить: {npc.id}</Button>
                  <Button size="small" variant="outlined" onClick={() => void inspectTarget(npc.id)} disabled={pending}>Осмотреть</Button>
                </Stack>
              ))}
              {(snapshot?.objects ?? []).map((worldObject) => (
                <Stack direction="row" spacing={1} key={worldObject.id}>
                  <Button size="small" variant="outlined" onClick={() => void interact(worldObject.id)} disabled={pending}>Взаимодействовать: {worldObject.id}</Button>
                  <Button size="small" variant="outlined" onClick={() => void inspectTarget(worldObject.id)} disabled={pending}>Осмотреть</Button>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}
