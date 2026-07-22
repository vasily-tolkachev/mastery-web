import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ApiRequestError,
  deleteNodeGeneratorProject,
  exportProjectJson,
  getNodeGeneratorProject,
  importNodeGeneratorProjectJson,
  renameNodeGeneratorProject,
} from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export function NodeGeneratorProjectHomePage() {
  const navigate = useNavigate();
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

  const handleDelete = async () => {
    if (!project) return;
    const confirmed = window.confirm(`Удалить квест "${project.name}"?`);
    if (!confirmed) return;
    try {
      clearUiError();
      await deleteNodeGeneratorProject(project.id);
      navigate('/node-generator');
    } catch (e) {
      applyUiError(e, 'Не удалось удалить проект');
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

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (!file) return;
    try {
      clearUiError();
      const parsed = JSON.parse(await file.text()) as unknown;
      const imported = await importNodeGeneratorProjectJson(parsed);
      navigate(`/node-generator/projects/${imported.id}`);
    } catch (e) {
      applyUiError(e, 'Не удалось импортировать JSON');
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

      <SectionCard title={project.name}>
        <Stack spacing={1.5}>
          <Typography variant="body2">Сцен: {sceneCount}</Typography>
          <Typography variant="body2">Знаний: {knowledgeCount}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField size="small" label="Имя квеста" value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} />
            <Button variant="outlined" onClick={() => void handleRename()} disabled={!renameDraft.trim()}>Переименовать</Button>
            <Button variant="outlined" color="error" onClick={() => void handleDelete()}>Удалить</Button>
          </Stack>
        </Stack>
      </SectionCard>

      <SectionCard title="Разделы квеста">
        <Stack spacing={1}>
          <NavCard
            title="▶ Продолжить создание"
            to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(project.workspace?.nodes?.[0]?.id ?? 'N1')}`}
          />
          <NavCard
            title="🌳 Дерево сцен"
            to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(project.workspace?.nodes?.[0]?.id ?? 'N1')}`}
          />
          <NavCard title="🌍 Глобальные знания" to={`/node-generator/projects/${project.id}/knowledge`} />
          <NavCard title="Проверка изменений" to={`/node-generator/projects/${project.id}/expansion`} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => void handleExport()}>📦 Экспорт</Button>
            <Button variant="outlined" component="label">
              Импорт JSON
              <input hidden type="file" accept=".json,application/json" onChange={(event) => void handleImport(event)} />
            </Button>
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
