import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { approveStage, createGeneratorProject, generateStage, generateStageStep, getGeneratorProject, getGeneratorProjects } from '../api/generatorApi';
import { EmptyState, LoadingState, SectionCard } from '../components/ui';
import type { GeneratorProject, GeneratorStage, GeneratorStageType } from '../types/generator';

const ORDERED_STAGE_TYPES: GeneratorStageType[] = ['MYSTERY', 'WORLD', 'NPC', 'FACTS', 'QUEST_GRAPH'];
const STAGE_STEPS: Partial<Record<GeneratorStageType, string[]>> = {
  FACTS: ['fact_list', 'fact_owners', 'fact_dependencies', 'fact_visibility'],
  QUEST_GRAPH: ['node_list', 'node_details', 'edges', 'endings'],
};

export function GeneratorPage() {
  const [projects, setProjects] = useState<GeneratorProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newQuestStyle, setNewQuestStyle] = useState('classic-adventure');
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await getGeneratorProjects();
      setProjects(loaded);
      if (!selectedProjectId && loaded.length > 0) {
        setSelectedProjectId(loaded[0].id);
      } else if (selectedProjectId && !loaded.some((project) => project.id === selectedProjectId)) {
        setSelectedProjectId(loaded[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить проекты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const refreshSelectedProject = async (projectId: string) => {
    const refreshed = await getGeneratorProject(projectId);
    setProjects((prev) => prev.map((project) => (project.id === refreshed.id ? refreshed : project)));
    setSelectedProjectId(refreshed.id);
    return refreshed;
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }
    const actionKey = 'create-project';
    try {
      setBusyAction(actionKey);
      setError(null);
      const created = await createGeneratorProject(newProjectName.trim(), newQuestStyle.trim());
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      setNewProjectName('');
      setNewQuestStyle('classic-adventure');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать проект');
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerate = async (stageType: GeneratorStageType) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `generate-${stageType}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await generateStage(selectedProjectId, stageType);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать этап');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleApprove = async (stageType: GeneratorStageType) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `approve-${stageType}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await approveStage(selectedProjectId, stageType);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось подтвердить этап');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateStep = async (stageType: GeneratorStageType, step: string) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `step-${stageType}-${step}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await generateStageStep(selectedProjectId, stageType, step);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сгенерировать шаг этапа');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка проектов генератора..." />;
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <SectionCard title="Генератор квестов">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            label="Название проекта"
            size="small"
            fullWidth
          />
          <TextField
            value={newQuestStyle}
            onChange={(event) => setNewQuestStyle(event.target.value)}
            label="Стиль квеста"
            size="small"
            fullWidth
          />
          <Button
            variant="contained"
            onClick={handleCreateProject}
            startIcon={<AutoFixHighRoundedIcon fontSize="small" />}
            disabled={!newProjectName.trim() || busyAction === 'create-project'}
            sx={{ minWidth: 180 }}
          >
            Создать проект
          </Button>
          <Button
            variant="outlined"
            onClick={() => void loadProjects()}
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            disabled={Boolean(busyAction)}
            sx={{ minWidth: 140 }}
          >
            Обновить
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Проекты">
        {!projects.length ? <EmptyState message="Пока нет проектов генератора." /> : null}
        <Stack spacing={1}>
          {projects.map((project) => (
            <Box
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProjectId(project.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setSelectedProjectId(project.id);
                }
              }}
              sx={{
                border: 1,
                borderColor: selectedProjectId === project.id ? 'primary.main' : 'divider',
                backgroundColor: selectedProjectId === project.id ? 'action.selected' : 'background.paper',
                borderRadius: 1,
                p: 1.5,
                cursor: 'pointer',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">{project.name}</Typography>
                <Chip size="small" label={project.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Стиль: {project.questStyle || 'classic-adventure'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {project.id}
              </Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      {selectedProject ? (
        <SectionCard title={`Этапы: ${selectedProject.name}`}>
          <Stack spacing={1.5}>
            {ORDERED_STAGE_TYPES.map((stageType) => {
              const stage = selectedProject.stages.find((item) => item.type === stageType);
              return stage ? (
                <StageRow
                  key={stageType}
                  stage={stage}
                  busyAction={busyAction}
                  onGenerate={() => void handleGenerate(stageType)}
                  onApprove={() => void handleApprove(stageType)}
                  onGenerateStep={(step) => void handleGenerateStep(stageType, step)}
                />
              ) : null;
            })}
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}

type StageRowProps = {
  stage: GeneratorStage;
  busyAction: string | null;
  onGenerate: () => void;
  onApprove: () => void;
  onGenerateStep: (step: string) => void;
};

function StageRow({ stage, busyAction, onGenerate, onApprove, onGenerateStep }: StageRowProps) {
  const isReadyToGenerate = stage.status === 'READY' || stage.status === 'REVIEW';
  const canApprove = stage.status === 'REVIEW' && Boolean(stage.currentRevision);

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">{stageTypeLabel(stage.type)}</Typography>
            <Chip size="small" label={stage.status} />
            {stage.approved ? (
              <Chip size="small" color="success" label="Подтверждено" icon={<CheckCircleRoundedIcon />} />
            ) : null}
            {stage.status === 'NOT_STARTED' ? (
              <Chip size="small" color="default" label="Заблокировано" icon={<LockRoundedIcon />} />
            ) : null}
          </Stack>
          {stage.currentRevision ? (
            <Typography variant="caption" color="text.secondary">
              Ревизия #{stage.currentRevision.revisionNumber} от {new Date(stage.currentRevision.createdAt).toLocaleString()}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">Ревизий пока нет</Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrowRoundedIcon fontSize="small" />}
            disabled={!isReadyToGenerate || busyAction === `generate-${stage.type}` || busyAction !== null}
            onClick={onGenerate}
          >
            Сгенерировать
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CheckCircleRoundedIcon fontSize="small" />}
            disabled={!canApprove || busyAction === `approve-${stage.type}` || busyAction !== null}
            onClick={onApprove}
          >
            Подтвердить
          </Button>
        </Stack>
      </Stack>

      {stage.currentRevision ? (
        <Box
          component="pre"
          sx={{
            mt: 1.5,
            mb: 0,
            p: 1,
            borderRadius: 1,
            bgcolor: 'background.default',
            maxHeight: 240,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 12,
          }}
        >
          {JSON.stringify(stage.currentRevision.outputJson, null, 2)}
        </Box>
      ) : null}

      {STAGE_STEPS[stage.type]?.length ? (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {STAGE_STEPS[stage.type]!.map((step) => (
            <Button
              key={step}
              size="small"
              variant="text"
              disabled={busyAction !== null || (!isReadyToGenerate && stage.status !== 'REVIEW')}
              onClick={() => onGenerateStep(step)}
            >
              {step}
            </Button>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function stageTypeLabel(type: GeneratorStageType): string {
  if (type === 'QUEST_GRAPH') return 'QUEST GRAPH';
  return type;
}
