import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ApiRequestError,
  exportProjectJson,
  getNodeGeneratorProject,
  renameNodeGeneratorProject,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export function NodeGeneratorProjectHomePage() {
  const { projectId = '' } = useParams();
  const [project, setProject] = useState<NodeGeneratorProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [renameDraft, setRenameDraft] = useState('');

  const sceneCount = useMemo(() => project?.workspace?.nodes?.length ?? 0, [project]);
  const knowledgeCount = useMemo(() => project?.workspace?.globalKnowledge?.length ?? 0, [project]);

  const clearUiError = () => {
    setError(null);
    setValidationErrors([]);
  };

  const applyUiError = (e: unknown, fallback: string) => {
    const message = e instanceof Error ? e.message : fallback;
    setError(message);
    if (e instanceof ApiRequestError) {
      setValidationErrors(e.errors ?? []);
      return;
    }
    setValidationErrors([]);
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      clearUiError();
      const loaded = await getNodeGeneratorProject(projectId);
      setProject(loaded);
      setRenameDraft(loaded.name);
    } catch (e) {
      applyUiError(e, 'Не удалось загрузить проект');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  const handleRename = async () => {
    if (!project) return;
    try {
      clearUiError();
      const updated = await renameNodeGeneratorProject(project.id, renameDraft);
      setProject(updated);
      setRenameDraft(updated.name);
    } catch (e) {
      applyUiError(e, 'Не удалось переименовать проект');
    }
  };

  const handleExport = async () => {
    if (!project) return;
    try {
      clearUiError();
      const snapshot = await exportProjectJson(project.id);
      const jsonText = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.trim().replace(/[^a-zA-Z0-9_-]+/g, '_') || 'quest'}-scene-snapshot.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      applyUiError(e, 'Не удалось экспортировать JSON');
    }
  };

  if (loading) return <LoadingState message="Загрузка квеста..." />;
  if (!project) return <Alert severity="error">Проект не найден</Alert>;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {validationErrors.length ? (
        <SectionCard title="Ошибки валидации">
          <Stack spacing={0.5}>
            {validationErrors.map((item, index) => (
              <Typography key={`${index}-${item}`} variant="body2" color="error">
                {index + 1}. {item}
              </Typography>
            ))}
          </Stack>
        </SectionCard>
      ) : null}

      <Typography variant="body2" color="text.secondary">
        Все квесты / {project.name}
      </Typography>
      <Button component={Link} to="/node-generator" variant="text" sx={{ alignSelf: 'flex-start' }}>
        ← Все квесты
      </Button>

      <SectionCard title="Главная квеста">
        <Stack spacing={1.5}>
          <TextField
            label="Название квеста"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            fullWidth
          />
          <Typography variant="body2">Сцен: {sceneCount}</Typography>
          <Typography variant="body2">Знаний: {knowledgeCount}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Button variant="outlined" onClick={() => void handleRename()} disabled={!renameDraft.trim() || renameDraft.trim() === project.name}>
              Сохранить название
            </Button>
            <Button variant="outlined" onClick={() => void handleExport()}>Экспорт</Button>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title="Разделы квеста">
        <Stack spacing={1}>
          <NavCard
            title="🕸️ Граф сцен"
            to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(project.workspace?.nodes?.[0]?.id ?? 'N1')}`}
          />
          <NavCard title="🌍 Глобальные знания" to={`/node-generator/projects/${project.id}/knowledge`} />
          <NavCard title="Проверка изменений" to={`/node-generator/projects/${project.id}/expansion`} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => void handleExport()}>📦 Экспорт</Button>
          </Box>
        </Stack>
      </SectionCard>
    </Stack>
  );
}

type NavCardProps = {
  title: string;
  to: string;
};

function NavCard({ title, to }: NavCardProps) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        display: 'block',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.25,
        textDecoration: 'none',
        color: 'text.primary',
      }}
    >
      <Typography variant="body1">{title}</Typography>
    </Box>
  );
}
