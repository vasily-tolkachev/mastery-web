import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  addPipelineStage,
  approvePipelineStage,
  createPipelineProject,
  deletePipelineStage,
  exportPipelineProject,
  getPipelineProject,
  importPipelineProject,
  listPipelineProjects,
  previewPipelineStage,
  runPipelineStage,
  updatePipelineStage,
} from '../api/pipelineBuilderApi';
import { EmptyState, SectionCard } from '../components/ui';
import type { PipelineProject, PipelinePromptPreview, PipelineStage } from '../types/pipelineBuilder';

const MEMORY_MODES = ['NONE', 'SELECTED_STAGES', 'ALL_PREVIOUS'] as const;

export function PipelineBuilderPage() {
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('Pipeline Project');
  const [newStageId, setNewStageId] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [stagePreviews, setStagePreviews] = useState<Record<string, PipelinePromptPreview>>({});
  const [stageDrafts, setStageDrafts] = useState<Record<string, { systemPrompt: string; userPrompt: string; args: string; memoryMode: string }>>({});

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const loadProjects = async () => {
    try {
      setError(null);
      const loaded = await listPipelineProjects();
      setProjects(loaded);
      if (!selectedProjectId && loaded.length > 0) setSelectedProjectId(loaded[0].id);
      if (selectedProjectId && !loaded.some((item) => item.id === selectedProjectId)) setSelectedProjectId(loaded[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const refreshProject = async (projectId: string) => {
    const updated = await getPipelineProject(projectId);
    setProjects((prev) => prev.map((item) => (item.id === projectId ? updated : item)));
    return updated;
  };

  const handleCreateProject = async () => {
    try {
      setError(null);
      const created = await createPipelineProject(newProjectName.trim() || 'Pipeline Project');
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    }
  };

  const handleAddStage = async () => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      const updated = await addPipelineStage(selectedProjectId, {
        stageId: newStageId,
        name: newStageName,
        systemPromptTemplate: '',
        userPromptTemplate: '',
        args: {},
        memoryMode: 'NONE',
        memorySources: [],
        dependencies: [],
      });
      setProjects((prev) => prev.map((item) => (item.id === selectedProjectId ? updated : item)));
      setNewStageId('');
      setNewStageName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add stage');
      await refreshProject(selectedProjectId);
    }
  };

  const updateDraft = (stage: PipelineStage, patch: Partial<{ systemPrompt: string; userPrompt: string; args: string; memoryMode: string }>) => {
    setStageDrafts((prev) => {
      const current = prev[stage.id] ?? {
        systemPrompt: stage.systemPromptTemplate,
        userPrompt: stage.userPromptTemplate,
        args: JSON.stringify(stage.args ?? {}, null, 2),
        memoryMode: stage.memoryMode,
      };
      return {
        ...prev,
        [stage.id]: { ...current, ...patch },
      };
    });
  };

  const handlePreviewStage = async (stage: PipelineStage) => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      const draft = stageDrafts[stage.id];
      const argsPayload = draft?.args ? JSON.parse(draft.args) : stage.args ?? {};
      const preview = await previewPipelineStage(selectedProjectId, stage.id, {
        systemPrompt: draft?.systemPrompt ?? stage.systemPromptTemplate,
        userPrompt: draft?.userPrompt ?? stage.userPromptTemplate,
        args: argsPayload,
      });
      setStagePreviews((prev) => ({ ...prev, [stage.id]: preview }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to preview stage');
    }
  };

  const handleSaveStage = async (stage: PipelineStage) => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      const draft = stageDrafts[stage.id];
      const updated = await updatePipelineStage(selectedProjectId, stage.id, {
        name: stage.name,
        enabled: stage.enabled,
        systemPromptTemplate: draft?.systemPrompt ?? stage.systemPromptTemplate,
        userPromptTemplate: draft?.userPrompt ?? stage.userPromptTemplate,
        args: draft?.args ? JSON.parse(draft.args) : stage.args ?? {},
        memoryMode: draft?.memoryMode ?? stage.memoryMode,
        memorySources: stage.memorySources,
        dependencies: stage.dependencies,
      });
      setProjects((prev) => prev.map((item) => (item.id === selectedProjectId ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save stage');
      await refreshProject(selectedProjectId);
    }
  };

  const handleRunStage = async (stage: PipelineStage) => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      const draft = stageDrafts[stage.id];
      const updated = await runPipelineStage(selectedProjectId, stage.id, {
        systemPrompt: draft?.systemPrompt ?? stage.systemPromptTemplate,
        userPrompt: draft?.userPrompt ?? stage.userPromptTemplate,
        args: draft?.args ? JSON.parse(draft.args) : stage.args ?? {},
      });
      setProjects((prev) => prev.map((item) => (item.id === selectedProjectId ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run stage');
      await refreshProject(selectedProjectId);
    }
  };

  const handleApproveStage = async (stage: PipelineStage) => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      const updated = await approvePipelineStage(selectedProjectId, stage.id);
      setProjects((prev) => prev.map((item) => (item.id === selectedProjectId ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve stage');
      await refreshProject(selectedProjectId);
    }
  };

  const handleDeleteStage = async (stage: PipelineStage) => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      const updated = await deletePipelineStage(selectedProjectId, stage.id);
      setProjects((prev) => prev.map((item) => (item.id === selectedProjectId ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete stage');
      await refreshProject(selectedProjectId);
    }
  };

  const handleExport = async () => {
    if (!selectedProjectId || !selectedProject) return;
    try {
      setError(null);
      const snapshot = await exportPipelineProject(selectedProjectId);
      const text = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedProject.name.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'pipeline'}-snapshot.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export');
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectId) return;
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (!file) return;
    try {
      setError(null);
      const parsed = JSON.parse(await file.text());
      const updated = await importPipelineProject(selectedProjectId, parsed);
      setProjects((prev) => prev.map((item) => (item.id === selectedProjectId ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import');
      await refreshProject(selectedProjectId);
    }
  };

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <SectionCard title="Pipeline Builder">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField size="small" label="Project Name" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} />
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => void handleCreateProject()}>
            Create Project
          </Button>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void loadProjects()}>
            Refresh
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Projects">
        {!projects.length ? <EmptyState message="No pipeline projects yet." /> : null}
        <Stack spacing={1}>
          {projects.map((project) => (
            <Box
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProjectId(project.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelectedProjectId(project.id);
              }}
              sx={{
                p: 1.25,
                border: 1,
                borderColor: selectedProjectId === project.id ? 'primary.main' : 'divider',
                borderRadius: 1,
                cursor: 'pointer',
              }}
            >
              <Typography variant="subtitle2">{project.name}</Typography>
              <Typography variant="caption" color="text.secondary">{project.id}</Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      {selectedProject ? (
        <SectionCard
          title={`Stages: ${selectedProject.name}`}
          action={(
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => void handleExport()}>Export</Button>
              <Button size="small" variant="contained" component="label">
                Import
                <input hidden type="file" accept=".json,application/json" onChange={(event) => void handleImport(event)} />
              </Button>
            </Stack>
          )}
        >
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField size="small" label="Stage ID" value={newStageId} onChange={(event) => setNewStageId(event.target.value)} />
              <TextField size="small" label="Stage Name" value={newStageName} onChange={(event) => setNewStageName(event.target.value)} />
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => void handleAddStage()}>
                Add Stage
              </Button>
            </Stack>

            {selectedProject.stages.map((stage) => {
              const draft = stageDrafts[stage.id] ?? {
                systemPrompt: stage.systemPromptTemplate,
                userPrompt: stage.userPromptTemplate,
                args: JSON.stringify(stage.args ?? {}, null, 2),
                memoryMode: stage.memoryMode,
              };
              const preview = stagePreviews[stage.id];
              return (
                <Box key={stage.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
                    <Box>
                      <Typography variant="subtitle2">{stage.id}</Typography>
                      <Typography variant="body2" color="text.secondary">{stage.name} • {stage.status}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" startIcon={<PreviewRoundedIcon />} onClick={() => void handlePreviewStage(stage)}>
                        Preview
                      </Button>
                      <Button size="small" variant="contained" startIcon={<PlayArrowRoundedIcon />} onClick={() => void handleRunStage(stage)}>
                        Run
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<CheckCircleRoundedIcon />} onClick={() => void handleApproveStage(stage)}>
                        Approve
                      </Button>
                      <Button size="small" color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => void handleDeleteStage(stage)}>
                        Delete
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      select
                      size="small"
                      label="Memory Mode"
                      value={draft.memoryMode}
                      onChange={(event) => updateDraft(stage, { memoryMode: event.target.value })}
                    >
                      {MEMORY_MODES.map((mode) => (
                        <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="System Prompt"
                      multiline
                      minRows={3}
                      value={draft.systemPrompt}
                      onChange={(event) => updateDraft(stage, { systemPrompt: event.target.value })}
                    />
                    <TextField
                      size="small"
                      label="User Prompt"
                      multiline
                      minRows={5}
                      value={draft.userPrompt}
                      onChange={(event) => updateDraft(stage, { userPrompt: event.target.value })}
                    />
                    <TextField
                      size="small"
                      label="Args JSON"
                      multiline
                      minRows={4}
                      value={draft.args}
                      onChange={(event) => updateDraft(stage, { args: event.target.value })}
                    />
                    <Button size="small" variant="text" onClick={() => void handleSaveStage(stage)}>
                      Save Stage Config
                    </Button>
                  </Stack>

                  {preview ? (
                    <Box component="pre" sx={{ mt: 1, mb: 0, p: 1, borderRadius: 1, bgcolor: 'background.default', maxHeight: 180, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {`SYSTEM:\n${preview.systemPrompt}\n\nUSER:\n${preview.userPrompt}\n\nMEMORY:\n${preview.memory}`}
                    </Box>
                  ) : null}

                  {stage.currentRevision ? (
                    <Box component="pre" sx={{ mt: 1, mb: 0, p: 1, borderRadius: 1, bgcolor: 'background.default', maxHeight: 220, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(stage.currentRevision.outputJson, null, 2)}
                    </Box>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}
