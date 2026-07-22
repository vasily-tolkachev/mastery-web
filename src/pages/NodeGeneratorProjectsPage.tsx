import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { type ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApiRequestError,
  createNodeGeneratorProject,
  deleteNodeGeneratorProject,
  exportProjectJson,
  getNodeGeneratorProjects,
  importNodeGeneratorProjectJson,
  renameNodeGeneratorProject,
} from '../api/nodeGeneratorApi';
import { EmptyState, LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export function NodeGeneratorProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<NodeGeneratorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const loadProjects = async () => {
    try {
      setLoading(true);
      clearUiError();
      setProjects(await getNodeGeneratorProjects());
    } catch (e) {
      applyUiError(e, 'Не удалось загрузить проекты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleCreateProject = async () => {
    try {
      clearUiError();
      const created = await createNodeGeneratorProject(generateProjectName(), 'classic-adventure');
      navigate(`/node-generator/projects/${created.id}`);
    } catch (e) {
      applyUiError(e, 'Не удалось создать проект');
    }
  };

  const handleImportJsonFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (!file) return;
    try {
      clearUiError();
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const imported = await importNodeGeneratorProjectJson(parsed);
      navigate(`/node-generator/projects/${imported.id}`);
    } catch (e) {
      applyUiError(e, 'Не удалось импортировать JSON');
    }
  };

  const handleRenameProject = async (project: NodeGeneratorProject) => {
    const nextName = window.prompt('Новое имя квеста', project.name)?.trim() ?? '';
    if (!nextName) return;
    try {
      clearUiError();
      await renameNodeGeneratorProject(project.id, nextName);
      await loadProjects();
    } catch (e) {
      applyUiError(e, 'Не удалось переименовать квест');
    }
  };

  const handleDeleteProject = async (project: NodeGeneratorProject) => {
    const confirmed = window.confirm(`Удалить квест "${project.name}"?`);
    if (!confirmed) return;
    try {
      clearUiError();
      await deleteNodeGeneratorProject(project.id);
      await loadProjects();
    } catch (e) {
      applyUiError(e, 'Не удалось удалить квест');
    }
  };

  const handleExportProject = async (project: NodeGeneratorProject) => {
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
      applyUiError(e, 'Не удалось экспортировать квест');
    }
  };

  if (loading) return <LoadingState message="Загрузка квестов..." />;

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

      <SectionCard title="Конструктор квестов">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button variant="contained" onClick={() => void handleCreateProject()}>+ Создать квест</Button>
          <Button variant="outlined" component="label">
            Импортировать квест
            <input hidden type="file" accept=".json,application/json" onChange={(event) => void handleImportJsonFile(event)} />
          </Button>
          <Button variant="text" onClick={() => void loadProjects()}>Обновить список</Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Мои квесты">
        {!projects.length ? <EmptyState message="Пока нет квестов." /> : null}
        <Stack spacing={1}>
          {projects.map((project) => (
            <Box
              key={project.id}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ alignItems: { md: 'center' }, width: '100%' }}>
                <Typography variant="subtitle1" sx={{ flex: 1 }}>📖 {project.name}</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/node-generator/projects/${project.id}`)}
                  >
                    Открыть
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => void handleRenameProject(project)}
                  >
                    Переименовать
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => void handleExportProject(project)}
                  >
                    Экспорт
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={() => void handleDeleteProject(project)}
                  >
                    Удалить
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}

function generateProjectName(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `Квест ${date} ${time}`;
}
