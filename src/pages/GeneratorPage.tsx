import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  approveChapter,
  approveScene,
  approveStage,
  createGeneratorProject,
  exportProjectJson,
  generateChapter,
  generateScene,
  generateStage,
  generateStageStep,
  getGeneratorProject,
  getGeneratorProjects,
  importProjectJson,
} from '../api/generatorApi';
import { EmptyState, LoadingState, SectionCard } from '../components/ui';
import type { GeneratorProject, GeneratorStage, GeneratorStageType } from '../types/generator';

const ORDERED_STAGE_TYPES: GeneratorStageType[] = ['QUEST_DESCRIPTION', 'WORLD', 'NPC', 'FACTS', 'QUEST_OUTLINE', 'CHAPTERS', 'SCENES'];

export function GeneratorPage() {
  const [projects, setProjects] = useState<GeneratorProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
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
    if (!newProjectName.trim()) {
      return;
    }
    try {
      setBusyAction('create-project');
      setError(null);
      const created = await createGeneratorProject(newProjectName.trim(), newQuestStyle.trim());
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      setNewProjectName('');
      setNewQuestStyle('classic-adventure');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
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

  const handleGenerateChapter = async (chapterId: string) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `generate-chapter-${chapterId}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await generateChapter(selectedProjectId, chapterId);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate chapter');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleApproveChapter = async (chapterId: string) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `approve-chapter-${chapterId}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await approveChapter(selectedProjectId, chapterId);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve chapter');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateScene = async (sceneId: string) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `generate-scene-${sceneId}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await generateScene(selectedProjectId, sceneId);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate scene');
      await refreshSelectedProject(selectedProjectId);
    } finally {
      setBusyAction(null);
    }
  };

  const handleApproveScene = async (sceneId: string) => {
    if (!selectedProjectId) {
      return;
    }
    const actionKey = `approve-scene-${sceneId}`;
    try {
      setBusyAction(actionKey);
      setError(null);
      const updated = await approveScene(selectedProjectId, sceneId);
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve scene');
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

  const outlineStage = selectedProject?.stages.find((stage) => stage.type === 'QUEST_OUTLINE') ?? null;
  const chaptersStage = selectedProject?.stages.find((stage) => stage.type === 'CHAPTERS') ?? null;
  const scenesStage = selectedProject?.stages.find((stage) => stage.type === 'SCENES') ?? null;
  const outlineChapters = extractOutlineChapters(outlineStage?.currentRevision?.outputJson);
  const generatedChapters = extractGeneratedChapters(chaptersStage?.currentRevision?.outputJson);
  const chapterItems = outlineChapters.map((chapter) => ({
    chapter,
    generated: generatedChapters.find((item) => item.chapterId.toUpperCase() === chapter.id.toUpperCase()) ?? null,
  }));
  const selectedChapter = chapterItems.find((item) => item.chapter.id === selectedChapterId) ?? chapterItems[0] ?? null;
  const chapterScenes = selectedChapter?.generated?.scenes ?? [];
  const generatedScenes = extractGeneratedScenes(scenesStage?.currentRevision?.outputJson);
  const sceneItems = chapterScenes.map((scene) => ({
    scene,
    generated: generatedScenes.find((item) => item.sceneId.toUpperCase() === scene.id.toUpperCase()) ?? null,
  }));
  const selectedScene = sceneItems.find((item) => item.scene.id === selectedSceneId) ?? sceneItems[0] ?? null;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <SectionCard title="Quest Generator">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} label="Project name" size="small" fullWidth />
          <TextField value={newQuestStyle} onChange={(event) => setNewQuestStyle(event.target.value)} label="Quest style" size="small" fullWidth />
          <Button
            variant="contained"
            onClick={handleCreateProject}
            startIcon={<AutoFixHighRoundedIcon fontSize="small" />}
            disabled={false}
            sx={{ minWidth: 180 }}
          >
            Create
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
                  busyAction={busyAction}
                  onGenerate={() => void handleGenerate(stage.type)}
                  onApprove={() => void handleApprove(stage.type)}
                  onGenerateStep={(step) => void handleGenerateStep(stage.type, step)}
                />
              ))}
          </Stack>
        </SectionCard>
      ) : null}

      {selectedProject && outlineStage?.status === 'APPROVED' ? (
        <SectionCard title="Chapter Generator">
          {!chapterItems.length ? (
            <Typography variant="body2" color="text.secondary">No chapters in QUEST_OUTLINE.</Typography>
          ) : (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Stack spacing={1} sx={{ minWidth: 280, maxWidth: 360 }}>
                {chapterItems.map(({ chapter, generated }) => (
                  <Box
                    key={chapter.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setSelectedChapterId(chapter.id);
                      }
                    }}
                    sx={{
                      border: 1,
                      borderColor: (selectedChapter?.chapter.id ?? '') === chapter.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1.25,
                      cursor: 'pointer',
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">{chapter.id}</Typography>
                      <Chip size="small" label={generated?.status ?? 'NOT_STARTED'} color={generated?.approved ? 'success' : 'default'} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{chapter.title}</Typography>
                  </Box>
                ))}
              </Stack>

              {selectedChapter ? (
                <Stack spacing={1.25} sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">{selectedChapter.chapter.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedChapter.chapter.purpose}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {selectedChapter.chapter.locations.map((id) => <Chip key={`loc-${id}`} size="small" label={id} />)}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {selectedChapter.chapter.participants.map((id) => <Chip key={`npc-${id}`} size="small" label={id} />)}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {selectedChapter.chapter.facts.map((id) => <Chip key={`fact-${id}`} size="small" label={id} />)}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => void handleGenerateChapter(selectedChapter.chapter.id)} disabled={false}>
                      Generate Scenes
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => void handleApproveChapter(selectedChapter.chapter.id)} disabled={false}>
                      Approve
                    </Button>
                  </Stack>
                  {selectedChapter.generated?.scenes ? (
                    <Box
                      component="pre"
                      sx={{
                        mt: 0.5,
                        mb: 0,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'background.default',
                        maxHeight: 280,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 12,
                      }}
                    >
                      {JSON.stringify(selectedChapter.generated.scenes, null, 2)}
                    </Box>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          )}
        </SectionCard>
      ) : null}

      {selectedProject && (chaptersStage?.status === 'REVIEW' || chaptersStage?.status === 'APPROVED') ? (
        <SectionCard title="Scene Generator">
          {!sceneItems.length ? (
            <Typography variant="body2" color="text.secondary">Generate chapter scenes first.</Typography>
          ) : (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <Stack spacing={1} sx={{ minWidth: 280, maxWidth: 360 }}>
                {sceneItems.map(({ scene, generated }) => (
                  <Box
                    key={scene.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSceneId(scene.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        setSelectedSceneId(scene.id);
                      }
                    }}
                    sx={{
                      border: 1,
                      borderColor: (selectedScene?.scene.id ?? '') === scene.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1.25,
                      cursor: 'pointer',
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">{scene.id}</Typography>
                      <Chip size="small" label={generated?.status ?? 'NOT_STARTED'} color={generated?.approved ? 'success' : 'default'} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{scene.title || scene.objective}</Typography>
                  </Box>
                ))}
              </Stack>

              {selectedScene ? (
                <Stack spacing={1.25} sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">{selectedScene.scene.title || selectedScene.scene.id}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedScene.scene.situation}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedScene.scene.objective}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip size="small" label={selectedScene.scene.location} />
                    {selectedScene.scene.participants.map((id) => <Chip key={`sp-${id}`} size="small" label={id} />)}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => void handleGenerateScene(selectedScene.scene.id)} disabled={false}>
                      Generate Steps
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => void handleApproveScene(selectedScene.scene.id)} disabled={false}>
                      Approve
                    </Button>
                  </Stack>
                  {selectedScene.generated ? (
                    <Box
                      component="pre"
                      sx={{
                        mt: 0.5,
                        mb: 0,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'background.default',
                        maxHeight: 320,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: 12,
                      }}
                    >
                      {JSON.stringify(selectedScene.generated, null, 2)}
                    </Box>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          )}
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
            variant="outlined"
            startIcon={<CheckCircleRoundedIcon fontSize="small" />}
            disabled={false}
            onClick={onApprove}
          >
            Approve
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
  if (stage.type === 'QUEST_OUTLINE') return 'Quest Outline';
  if (stage.type === 'QUEST_GRAPH') return 'Quest Graph';
  return stage.type;
}

function stageOrder(type: GeneratorStageType): number {
  const index = ORDERED_STAGE_TYPES.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

type OutlineChapter = {
  id: string;
  title: string;
  purpose: string;
  locations: string[];
  participants: string[];
  facts: string[];
};

type GeneratedChapter = {
  chapterId: string;
  status: string;
  approved: boolean;
  scenes: ChapterScene[];
};

type ChapterScene = {
  id: string;
  title: string;
  situation: string;
  objective: string;
  location: string;
  participants: string[];
};

type GeneratedScene = {
  sceneId: string;
  status: string;
  approved: boolean;
  entryStep: string;
  steps: unknown[];
};

function extractOutlineChapters(output: unknown): OutlineChapter[] {
  if (!output || typeof output !== 'object') return [];
  const raw = output as Record<string, unknown>;
  const chapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  return chapters
    .map((item) => {
      const c = (item ?? {}) as Record<string, unknown>;
      return {
        id: String(c.id ?? ''),
        title: String(c.title ?? ''),
        purpose: String(c.purpose ?? ''),
        locations: toStringArray(c.locations),
        participants: toStringArray(c.participants),
        facts: toStringArray(c.facts),
      };
    })
    .filter((c) => c.id);
}

function extractGeneratedChapters(output: unknown): GeneratedChapter[] {
  if (!output || typeof output !== 'object') return [];
  const raw = output as Record<string, unknown>;
  const chapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  return chapters
    .map((item) => {
      const c = (item ?? {}) as Record<string, unknown>;
      return {
        chapterId: String(c.chapterId ?? ''),
        status: String(c.status ?? 'REVIEW'),
        approved: Boolean(c.approved),
        scenes: extractChapterScenes(c.scenes),
      };
    })
    .filter((c) => c.chapterId);
}

function extractChapterScenes(rawScenes: unknown): ChapterScene[] {
  if (!Array.isArray(rawScenes)) return [];
  return rawScenes
    .map((item) => {
      const s = (item ?? {}) as Record<string, unknown>;
      return {
        id: String(s.id ?? ''),
        title: String(s.title ?? ''),
        situation: String(s.situation ?? ''),
        objective: String(s.objective ?? ''),
        location: String(s.location ?? ''),
        participants: toStringArray(s.participants),
      };
    })
    .filter((s) => s.id);
}

function extractGeneratedScenes(output: unknown): GeneratedScene[] {
  if (!output || typeof output !== 'object') return [];
  const raw = output as Record<string, unknown>;
  const scenes = Array.isArray(raw.scenes) ? raw.scenes : [];
  return scenes
    .map((item) => {
      const s = (item ?? {}) as Record<string, unknown>;
      return {
        sceneId: String(s.sceneId ?? ''),
        status: String(s.status ?? 'REVIEW'),
        approved: Boolean(s.approved),
        entryStep: String(s.entryStep ?? ''),
        steps: Array.isArray(s.steps) ? s.steps : [],
      };
    })
    .filter((s) => s.sceneId);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((x) => String(x)).filter(Boolean) : [];
}
