import { Alert, Box, Breadcrumbs, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiRequestError, createQuestFromNodeGeneratorProject, renameNodeGeneratorProject } from '../api/nodeGeneratorApi';
import { LoadingState, SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';

export function NodeGeneratorProjectHomePage() {
  const navigate = useNavigate();
  const { projectId = '' } = useParams();
  const { data: project, isLoading, isError, error: projectError } = useNodeGeneratorProject(projectId);
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [renameDraft, setRenameDraft] = useState('');
  const [createQuestPending, setCreateQuestPending] = useState(false);

  useEffect(() => {
    setRenameDraft(project?.name ?? '');
  }, [project?.id, project?.name]);

  const sceneCount = useMemo(() => project?.workspace?.nodes?.length ?? 0, [project]);
  const actionsCount = useMemo(
    () => (project?.workspace?.nodes ?? []).reduce((sum, node) => sum + (node.actions?.length ?? 0), 0),
    [project],
  );
  const knowledgeCount = useMemo(() => project?.workspace?.globalKnowledge?.length ?? 0, [project]);
  const firstSceneId = useMemo(
    () => project?.workspace?.nodes?.map((node) => (node.id ?? '').trim()).find((id) => id.length > 0) ?? 'N1',
    [project],
  );

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

  const handleRenameOnBlur = async () => {
    if (!project) return;
    const nextName = renameDraft.trim();
    if (!nextName || nextName === project.name) return;
    try {
      clearUiError();
      const updated = await renameNodeGeneratorProject(project.id, nextName);
      setProjectCache(updated);
      setRenameDraft(updated.name);
    } catch (e) {
      applyUiError(e, 'Не удалось сохранить название');
      setRenameDraft(project.name);
    }
  };

  const handleCreateQuest = async () => {
    if (!project) return;
    try {
      clearUiError();
      setCreateQuestPending(true);
      await createQuestFromNodeGeneratorProject(project.id);
      navigate('/quests');
    } catch (e) {
      applyUiError(e, 'Не удалось создать квест');
    } finally {
      setCreateQuestPending(false);
    }
  };

  if (isLoading) return <LoadingState message="Загрузка квеста..." />;
  if (isError) return <Alert severity="error">{projectError instanceof Error ? projectError.message : 'Не удалось загрузить проект'}</Alert>;
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
          <Typography variant="body2">Действий: {actionsCount}</Typography>
          <Typography variant="body2">Знаний: {knowledgeCount}</Typography>
        </Stack>
      </SectionCard>

      <SectionCard title="Разделы квеста">
        <Stack spacing={1}>
          <Button variant="contained" onClick={() => void handleCreateQuest()} disabled={createQuestPending}>
            Создать квест из текущих данных
          </Button>
          <NavCard
            title="Продолжить работу"
            to={`/node-generator/projects/${project.id}/scenes/${encodeURIComponent(firstSceneId)}`}
          />
          <NavCard title="Глобальные знания" to={`/node-generator/projects/${project.id}/knowledge`} />
          <NavCard title="Проверка изменений" to={`/node-generator/projects/${project.id}/expansion`} disabled />
        </Stack>
      </SectionCard>
    </Stack>
  );
}

type NavCardProps = {
  title: string;
  to: string;
  disabled?: boolean;
};

function NavCard({ title, to, disabled = false }: NavCardProps) {
  if (disabled) {
    return (
      <Box
        sx={{
          display: 'block',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.25,
          color: 'text.disabled',
          bgcolor: 'action.hover',
          cursor: 'not-allowed',
          opacity: 0.7,
        }}
      >
        <Typography variant="body1">{title}</Typography>
      </Box>
    );
  }

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
