import { Alert, Breadcrumbs, Button, Link as MuiLink, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { inspectTextRuntime, moveTextRuntime, startTextRuntime, takeTextRuntime, type RuntimeSnapshot } from '../api/textRuntimeApi';
import { SectionCard } from '../components/ui';
import { useNodeGeneratorProject } from '../hooks/useNodeGeneratorProject';

export function NodeGeneratorRuntimePage() {
  const { projectId = '' } = useParams();
  const { data: project } = useNodeGeneratorProject(projectId);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setError(null);
        setPending(true);
        const started = await startTextRuntime(projectId);
        if (cancelled) return;
        setSnapshot(started);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Не удалось открыть текстовый режим');
      } finally {
        if (cancelled) return;
        setPending(false);
      }
    };
    if (projectId) void run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const refresh = async () => {
    if (!snapshot?.sessionId) return;
    setSnapshot(await inspectTextRuntime(snapshot.sessionId));
  };

  const handleMove = async (locationId: string | null) => {
    if (!snapshot?.sessionId || !locationId) return;
    try {
      setPending(true);
      setError(null);
      setSnapshot(await moveTextRuntime(snapshot.sessionId, locationId));
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
      setSnapshot(await takeTextRuntime(snapshot.sessionId, itemId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось взять предмет');
    } finally {
      setPending(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">Все квесты</MuiLink>
        {project ? <MuiLink component={Link} to={`/node-generator/projects/${project.id}`} underline="hover" color="inherit">{project.name}</MuiLink> : null}
        <Typography color="text.primary">Текстовый режим</Typography>
      </Breadcrumbs>

      {project ? (
        <Tabs
          value="runtime"
          aria-label="Вкладки квеста"
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab label="Профиль" value="profile" component={Link} to={`/node-generator/projects/${project.id}`} />
          <Tab label="Текстовое прохождение" value="runtime" component={Link} to={`/node-generator/projects/${project.id}/runtime`} />
        </Tabs>
      ) : null}

      <SectionCard title={snapshot ? `Сцена ${snapshot.currentLocationId}` : 'Текстовый режим'}>
        <Stack spacing={1.25}>
          <Typography variant="body2">{snapshot?.description || (pending ? 'Загрузка...' : 'Нет данных.')}</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => void refresh()} disabled={!snapshot || pending}>Обновить</Button>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title="Доступные действия">
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
            <Button key={item.id} variant="text" onClick={() => void handleTake(item.id)} disabled={pending}>
              Взять: {item.name || item.id}
            </Button>
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
  );
}
