import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  approveAchievementScene,
  approveStage,
  createGeneratorProject,
  exportProjectJson,
  previewStagePrompt,
  generateAchievementScene,
  generateStage,
  generateStageStep,
  getGeneratorProject,
  getGeneratorProjects,
  importProjectJson,
} from '../api/generatorApi';
import { EmptyState, LoadingState, SectionCard } from '../components/ui';
import type { GeneratorProject, GeneratorStage, GeneratorStageType, StagePromptPreview } from '../types/generator';

const ORDERED_STAGE_TYPES: GeneratorStageType[] = ['QUEST_DESCRIPTION', 'QUEST_CONSTRAINTS', 'ACHIEVEMENT_RESOURCE_ANALYSIS', 'WORLD', 'ACHIEVEMENT_REALISATION', 'ACHIEVEMENT_INFORMATION_FLOW', 'KNOWLEDGE_CHAIN', 'ACHIEVEMENT_SCENES', 'ACTION_QUESTS'];

export function GeneratorPage() {
  const [projects, setProjects] = useState<GeneratorProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptPreviews, setPromptPreviews] = useState<Record<string, StagePromptPreview>>({});

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
      setError(e instanceof Error ? e.message : 'Failed to load projects');
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
    try {
      setBusyAction('create-project');
      setError(null);
      const created = await createGeneratorProject(generateProjectName(), 'classic-adventure');
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setBusyAction(null);
    }
  };

  const handlePreview = async (stageType: GeneratorStageType) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `preview-${stageType}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const preview = await previewStagePrompt(selectedProjectId, stageType);
      setPromptPreviews((prev) => ({ ...prev, [stageType]: preview }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to preview stage prompt');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSend = async (stageType: GeneratorStageType) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `send-${stageType}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await generateStage(selectedProjectId, stageType);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate stage');
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
      setError(e instanceof Error ? e.message : 'Failed to approve stage');
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
      setError(e instanceof Error ? e.message : 'Failed to generate step');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };


  const handleExportJson = async () => {
    if (!selectedProjectId || !selectedProject) {
      return;
    }
    try {
      setBusyAction('export-json');
      setError(null);
      const snapshot = await exportProjectJson(selectedProjectId);
      const jsonText = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = selectedProject.name.trim().replace(/[^a-zA-Z0-9_-]+/g, '_') || 'generator_project';
      link.download = `${safeName}-snapshot.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export JSON');
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportJsonFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectId) {
      return;
    }
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (!file) {
      return;
    }
    try {
      setBusyAction('import-json');
      setError(null);
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const updated = await importProjectJson(selectedProjectId, parsed);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import JSON');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading generator projects..." />;
  }

  const realisationStage = selectedProject?.stages.find((stage) => stage.type === 'ACHIEVEMENT_REALISATION') ?? null;
  const achievementScenesStage = selectedProject?.stages.find((stage) => stage.type === 'ACHIEVEMENT_SCENES') ?? null;
  const ways = extractRealisationWays(realisationStage?.currentRevision?.outputJson);
  const generatedAchievementScenes = extractGeneratedWayScenes(achievementScenesStage?.currentRevision?.outputJson);

  const handleGenerateWay = async (wayId: string) => {
    if (!selectedProjectId) return;
    try {
      setBusyAction(`generate-way-${wayId}`);
      setError(null);
      const updated = await generateAchievementScene(selectedProjectId, wayId);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate achievement scenes');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleApproveWay = async (wayId: string) => {
    if (!selectedProjectId) return;
    try {
      setBusyAction(`approve-way-${wayId}`);
      setError(null);
      const updated = await approveAchievementScene(selectedProjectId, wayId);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve achievement scenes');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };


  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <SectionCard title="Quest Generator">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            onClick={handleCreateProject}
            startIcon={<AutoFixHighRoundedIcon fontSize="small" />}
            disabled={false}
            sx={{ minWidth: 180 }}
          >
            Create New Project
          </Button>
          <Button variant="outlined" onClick={() => void loadProjects()} startIcon={<RefreshRoundedIcon fontSize="small" />} disabled={false} sx={{ minWidth: 140 }}>
            Refresh
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Projects">
        {!projects.length ? <EmptyState message="No generator projects yet." /> : null}
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
              <Typography variant="body2" color="text.secondary">Style: {project.questStyle || 'classic-adventure'}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{project.id}</Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      {selectedProject ? (
        <SectionCard
          title={`Stages: ${selectedProject.name}`}
          action={
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => void handleExportJson()} disabled={false}>Export JSON</Button>
              <Button size="small" variant="contained" component="label" disabled={false}>
                Import JSON
                <input hidden type="file" accept=".json,application/json" onChange={(event) => void handleImportJsonFile(event)} />
              </Button>
            </Stack>
          }
        >
          <Stack spacing={1.5}>
            {selectedProject.stages
              .slice()
              .sort((a, b) => stageOrder(a.type) - stageOrder(b.type))
              .map((stage) => (
                <StageRow
                  key={stage.type}
                  stage={stage}
                  promptPreview={promptPreviews[stage.type] ?? null}
                  onGenerate={() => void handlePreview(stage.type)}
                  onSend={() => void handleSend(stage.type)}
                  onApprove={() => void handleApprove(stage.type)}
                  onGenerateStep={(step) => void handleGenerateStep(stage.type, step)}
                />
              ))}
          </Stack>
        </SectionCard>
      ) : null}

      {selectedProject ? (
        <SectionCard title="Achievement Scenes">
          {!ways.length ? (
            <Typography variant="body2" color="text.secondary">No ways found in ACHIEVEMENT_REALISATION.</Typography>
          ) : (
            <Stack spacing={1}>
              {ways.map((way) => {
                const generated = generatedAchievementScenes.find((item) => item.wayId.toUpperCase() === way.id.toUpperCase()) ?? null;
                return (
                  <Box key={way.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
                      <Box>
                        <Typography variant="subtitle2">{way.id}</Typography>
                        <Typography variant="body2" color="text.secondary">Achievement: {way.achievementId}</Typography>
                        <Typography variant="body2" color="text.secondary">{way.description}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        <Chip size="small" label={generated?.status ?? 'NOT_STARTED'} color={generated?.approved ? 'success' : 'default'} />
                        <Button size="small" variant="contained" onClick={() => void handleGenerateWay(way.id)} disabled={false}>
                          Generate
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => void handleApproveWay(way.id)} disabled={false}>
                          Approve
                        </Button>
                      </Stack>
                    </Stack>
                    {generated?.quests ? (
                      <Box
                        component="pre"
                        sx={{
                          mt: 1,
                          mb: 0,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: 'background.default',
                          maxHeight: 260,
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(generated.quests, null, 2)}
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          )}
        </SectionCard>
      ) : null}
    </Stack>
  );
}

type StageRowProps = {
  stage: GeneratorStage;
  promptPreview: StagePromptPreview | null;
  onGenerate: () => void;
  onSend: () => void;
  onApprove: () => void;
  onGenerateStep: (_step: string) => void;
};

function StageRow({ stage, promptPreview, onGenerate, onSend, onApprove, onGenerateStep }: StageRowProps) {
  const steps: string[] = [];

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">{stageTypeLabel(stage)}</Typography>
            <Chip size="small" label={stage.status} />
            {stage.approved ? <Chip size="small" color="success" label="Approved" icon={<CheckCircleRoundedIcon />} /> : null}
            {stage.status === 'NOT_STARTED' ? <Chip size="small" color="default" label="Locked" icon={<LockRoundedIcon />} /> : null}
          </Stack>
          {stage.currentRevision ? (
            <Typography variant="caption" color="text.secondary">Revision #{stage.currentRevision.revisionNumber} at {new Date(stage.currentRevision.createdAt).toLocaleString()}</Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">No revisions yet</Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayArrowRoundedIcon fontSize="small" />}
            disabled={false}
            onClick={onGenerate}
          >
            Generate
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={false}
            onClick={onSend}
          >
            Send
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<CheckCircleRoundedIcon fontSize="small" />}
            disabled={false}
            onClick={onApprove}
          >
            Approve
          </Button>
        </Stack>
      </Stack>

      {promptPreview ? (
        <Box
          component="pre"
          sx={{
            mt: 1.5,
            mb: 0,
            p: 1,
            borderRadius: 1,
            bgcolor: 'background.default',
            maxHeight: 220,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: 12,
          }}
        >
          {`SYSTEM:\n${promptPreview.systemPrompt}\n\nUSER:\n${promptPreview.userPrompt}`}
        </Box>
      ) : null}

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

      {steps.length ? (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          {steps.map((step) => (
            <Button
              key={step}
              size="small"
              variant="text"
              disabled={false}
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

function stageTypeLabel(stage: GeneratorStage): string {
  if (stage.displayName?.trim()) return stage.displayName;
  if (stage.type === 'QUEST_DESCRIPTION' || stage.type === 'MYSTERY') return 'Quest Description';
  if (stage.type === 'QUEST_CONSTRAINTS') return 'Quest Constraints';
  if (stage.type === 'ACHIEVEMENT_RESOURCE_ANALYSIS') return 'Achievement Resource Analysis';
  if (stage.type === 'ACHIEVEMENT_REALISATION' || stage.type === 'NPC') return 'Achievement Realisation';
  if (stage.type === 'ACHIEVEMENT_INFORMATION_FLOW') return 'Achievement Information Flow';
  if (stage.type === 'KNOWLEDGE_CHAIN') return 'Knowledge Chain';
  if (stage.type === 'ACHIEVEMENT_SCENES') return 'Achievement Scenes';
  if (stage.type === 'ACTION_QUESTS') return 'Action Quests';
  if (stage.type === 'QUEST_OUTLINE') return 'Quest Outline';
  if (stage.type === 'QUEST_GRAPH') return 'Quest Graph';
  return stage.type;
}

function stageOrder(type: GeneratorStageType): number {
  const index = ORDERED_STAGE_TYPES.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function generateProjectName(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `Quest Project ${date} ${time}`;
}

type RealisationWay = {
  id: string;
  achievementId: string;
  description: string;
};

type GeneratedWayScenes = {
  wayId: string;
  achievementId: string;
  status: string;
  approved: boolean;
  quests: unknown[];
};

function extractRealisationWays(output: unknown): RealisationWay[] {
  if (!output || typeof output !== 'object') return [];
  const raw = output as Record<string, unknown>;
  const realisations = Array.isArray(raw.achievement_realisations) ? raw.achievement_realisations : [];
  const ways: RealisationWay[] = [];
  realisations.forEach((item) => {
    const r = (item ?? {}) as Record<string, unknown>;
    const achievementId = String(r.achievement_id ?? '');
    const wayItems = Array.isArray(r.ways) ? r.ways : [];
    wayItems.forEach((w) => {
      const way = (w ?? {}) as Record<string, unknown>;
      const id = String(way.id ?? '');
      if (id) {
        ways.push({
          id,
          achievementId,
          description: String(way.description ?? ''),
        });
      }
    });
  });
  return ways;
}

function extractGeneratedWayScenes(output: unknown): GeneratedWayScenes[] {
  if (!output || typeof output !== 'object') return [];
  const raw = output as Record<string, unknown>;
  const ways = Array.isArray(raw.ways) ? raw.ways : [];
  return ways
    .map((item) => {
      const a = (item ?? {}) as Record<string, unknown>;
      return {
        wayId: String(a.way_id ?? ''),
        achievementId: String(a.achievement_id ?? ''),
        status: String(a.status ?? 'REVIEW'),
        approved: Boolean(a.approved),
        quests: Array.isArray(a.quests) ? a.quests : [],
      };
    })
    .filter((a) => a.wayId);
}
