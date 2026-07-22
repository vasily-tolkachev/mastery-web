import { Alert, Box, Breadcrumbs, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ApiRequestError,
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

  const handleRenameOnBlur = async () => {
    if (!project) return;
    const nextName = renameDraft.trim();
    if (!nextName || nextName === project.name) return;
    try {
      clearUiError();
      const updated = await renameNodeGeneratorProject(project.id, nextName);
      setProject(updated);
      setRenameDraft(updated.name);
    } catch (e) {
      applyUiError(e, 'Не удалось сохранить название');
      setRenameDraft(project.name);
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

      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">
          Все квесты
        </MuiLink>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      <SectionCard title="Главная квеста">
        <Stack spacing={1.5}>
          <TextField
            label="Название квеста"
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onBlur={() => void handleRenameOnBlur()}
            fullWidth
          />
          <Typography variant="body2">Сцен: {sceneCount}</Typography>
          <Typography variant="body2">Знаний: {knowledgeCount}</Typography>
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
