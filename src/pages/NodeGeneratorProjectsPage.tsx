import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { type ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ApiRequestError,
  createNodeGeneratorProject,
  deleteNodeGeneratorProject,
  exportProjectJson,
  getNodeGeneratorProjects,
  importNodeGeneratorProjectJson,
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
      const parsed = JSON.parse(await file.text()) as unknown;
      const imported = await importNodeGeneratorProjectJson(parsed);
      navigate(`/node-generator/projects/${imported.id}`);
    } catch (e) {
      applyUiError(e, 'Не удалось импортировать JSON');
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
            <Stack key={project.id} direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
              <Box sx={{ flex: 1, minWidth: 0, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Button
                  fullWidth
                  onClick={() => navigate(`/node-generator/projects/${project.id}`)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    px: 1.25,
                    py: 0.5,
                    minHeight: 34,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" noWrap>📖 {project.name}</Typography>
                </Button>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <IconButton
                    size="small"
                    aria-label="Экспорт"
                    onClick={() => void handleExportProject(project)}
                    sx={{ width: 34, height: 34, p: 0 }}
                  >
                    <FileDownloadOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Удалить"
                    onClick={() => void handleDeleteProject(project)}
                    sx={{ width: 34, height: 34, p: 0 }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>
            </Stack>
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
