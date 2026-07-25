import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  inspectTargetTextRuntime,
  inspectTextRuntime,
  interactTextRuntime,
  moveTextRuntime,
  startTextRuntimeQuest,
  takeTextRuntime,
  useTextRuntime,
  type RuntimeItem,
  type RuntimeSnapshot,
} from '../api/textRuntimeApi';
import { SectionCard } from '../components/ui';

export function TextRuntimeQuestPage() {
  const { questId = '' } = useParams();
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [inspectResult, setInspectResult] = useState<string | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setPending(true);
        setError(null);
        const started = await startTextRuntimeQuest(questId);
        if (cancelled) return;
        setSnapshot(started);
        setSelectedInventoryItem('');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось запустить текстовый режим');
      } finally {
        if (cancelled) return;
        setPending(false);
      }
    };
    if (questId) void run();
    return () => {
      cancelled = true;
    };
  }, [questId]);

  const refresh = async () => {
    if (!snapshot?.sessionId) return;
    setPending(true);
    try {
      setSnapshot(await inspectTextRuntime(snapshot.sessionId));
    } finally {
      setPending(false);
    }
  };

  const handleMove = async (locationId: string | null) => {
    if (!snapshot?.sessionId || !locationId) return;
    try {
      setPending(true);
      setError(null);
      setSnapshot(await moveTextRuntime(snapshot.sessionId, locationId));
      setInspectResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Переход недоступен');
    } finally {
      setPending(false);
    }
  };

  const handleTake = async (itemId: string) => {
    if (!snapshot?.sessionId) return;
    try {
      setPending(true);
      setError(null);
      const next = await takeTextRuntime(snapshot.sessionId, itemId);
      setSnapshot(next);
      setInspectResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось взять предмет');
    } finally {
      setPending(false);
    }
  };

  const handleInteract = async (customTarget?: string) => {
    if (!snapshot?.sessionId) return;
    const target = (customTarget ?? targetId).trim();
    if (!target) return;
    try {
      setPending(true);
      setError(null);
      const result = await interactTextRuntime(snapshot.sessionId, target);
      setSnapshot(result.snapshot);
      setInspectResult(result.message);
      setTargetId(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить взаимодействие');
    } finally {
      setPending(false);
    }
  };

  const handleInspectTarget = async (customTarget?: string) => {
    if (!snapshot?.sessionId) return;
    const target = (customTarget ?? targetId).trim();
    if (!target) return;
    try {
      setPending(true);
      setError(null);
      setInspectResult(await inspectTargetTextRuntime(snapshot.sessionId, target));
      setTargetId(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось осмотреть цель');
    } finally {
      setPending(false);
    }
  };

  const handleUse = async () => {
    if (!snapshot?.sessionId || !selectedInventoryItem) return;
    const target = targetId.trim();
    if (!target) return;
    try {
      setPending(true);
      setError(null);
      const next = await useTextRuntime(snapshot.sessionId, selectedInventoryItem, target);
      setSnapshot(next);
      setInspectResult(`Использовано: ${selectedInventoryItem} -> ${target}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось использовать предмет');
    } finally {
      setPending(false);
    }
  };

  const inventory: RuntimeItem[] = useMemo(() => snapshot?.inventory ?? [], [snapshot]);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/text-runtime" underline="hover" color="inherit">Текстовый режим</MuiLink>
        <Typography color="text.primary">{questId}</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          <SectionCard title={snapshot ? `Сцена ${snapshot.currentLocationId}` : 'Сцена'}>
            <Stack spacing={1.25}>
              <Typography variant="body2">{snapshot?.description || (pending ? 'Загрузка...' : 'Нет данных.')}</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => void refresh()} disabled={!snapshot || pending}>Обновить</Button>
              </Stack>
            </Stack>
          </SectionCard>

          <SectionCard title="Действия">
            <Stack spacing={1}>
              <TextField
                size="small"
                label="Цель"
                placeholder="ворота, метки, выживший..."
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                fullWidth
              />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" onClick={() => void handleInspectTarget()} disabled={pending || !targetId.trim()}>
                  Осмотреть цель
                </Button>
                <Button size="small" variant="contained" onClick={() => void handleInteract()} disabled={pending || !targetId.trim()}>
                  Взаимодействовать
                </Button>
              </Stack>
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
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => void handleUse()}
                  disabled={pending || !selectedInventoryItem || !targetId.trim()}
                >
                  Использовать на цели
                </Button>
              </Stack>
              {inspectResult ? <Alert severity="info">{inspectResult}</Alert> : null}
            </Stack>
          </SectionCard>
        </Stack>

        <Stack spacing={2}>
          <SectionCard title="Переходы">
            <Stack spacing={1}>
              {(snapshot?.exits ?? []).length === 0 ? <Typography variant="body2" color="text.secondary">Нет доступных переходов.</Typography> : null}
              {(snapshot?.exits ?? []).map((exit, index) => (
                <Button
                  key={`${exit.actionText}-${index}`}
                  variant="outlined"
                  onClick={() => void handleMove(exit.targetLocationId)}
                  disabled={pending || !exit.targetLocationId}
                >
                  {exit.actionText}
                </Button>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Предметы сцены">
            <Stack spacing={1}>
              {(snapshot?.items ?? []).length === 0 ? <Typography variant="body2" color="text.secondary">Нет предметов.</Typography> : null}
              {(snapshot?.items ?? []).map((item) => (
                <Stack direction="row" spacing={1} key={item.id}>
                  <Button variant="text" onClick={() => void handleTake(item.id)} disabled={pending}>
                    Взять: {item.name || item.id}
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleInspectTarget(item.id)} disabled={pending}>
                    Осмотреть
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleInteract(item.id)} disabled={pending}>
                    Взаимодействовать
                  </Button>
                </Stack>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Персонажи">
            <Stack spacing={1}>
              {(snapshot?.npcs ?? []).length === 0 ? <Typography variant="body2" color="text.secondary">Нет персонажей рядом.</Typography> : null}
              {(snapshot?.npcs ?? []).map((npc) => (
                <Stack direction="row" spacing={1} key={npc.id}>
                  <Button size="small" variant="contained" onClick={() => void handleInteract(npc.id)} disabled={pending}>
                    Поговорить: {npc.id}
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleInspectTarget(npc.id)} disabled={pending}>
                    Осмотреть
                  </Button>
                </Stack>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Инвентарь">
            <Stack spacing={0.5}>
              {(snapshot?.inventory ?? []).length === 0 ? <Typography variant="body2" color="text.secondary">Пусто.</Typography> : null}
              {(snapshot?.inventory ?? []).map((item) => (
                <Typography key={item.id} variant="body2">• {item.name || item.id}</Typography>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}
