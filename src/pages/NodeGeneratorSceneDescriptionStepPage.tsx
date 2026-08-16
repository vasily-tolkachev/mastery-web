import { Alert, Box, Breadcrumbs, Button, CircularProgress, Link as MuiLink, Stack, Step, StepButton, Stepper, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addWorkspaceNodeAction,
  createNextWorkspaceNode,
  createNodeGeneratorProject,
  createWorkspaceNode,
  deleteWorkspaceNodeAction,
  generateFirstSceneIdeas,
  generateNextSceneIdeas,
  generateWorkspaceNodeActions,
  getNodeGeneratorProject,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import type { FirstSceneIdea } from '../api/nodeGeneratorApi';
import { SectionCard } from '../components/ui';
import { useNodeGeneratorProject, useSetNodeGeneratorProjectCache } from '../hooks/useNodeGeneratorProject';
import type { WorkspaceAction } from '../types/nodeGenerator';

type Mode = 'first' | 'next' | 'edit';

type Props = {
  mode: Mode;
  projectId?: string;
  sceneId?: string;
  actionId?: string;
};

type SceneFlowStrategy = {
  breadcrumbTitle: string;
  sceneFieldLabel: string;
  showIdeas: boolean;
  showPreviousContext: boolean;
};

const STEPS = ['Description', 'Actions', 'Done'];

export function NodeGeneratorSceneDescriptionStepPage({ mode, projectId, sceneId, actionId }: Props) {
  const navigate = useNavigate();
  const setProjectCache = useSetNodeGeneratorProjectCache();
  const { data: contextProject } = useNodeGeneratorProject(mode === 'first' ? '' : (projectId ?? ''));

  const strategy: SceneFlowStrategy = useMemo(() => {
    if (mode === 'first') return { breadcrumbTitle: 'New Quest', sceneFieldLabel: 'First scene description', showIdeas: true, showPreviousContext: false };
    if (mode === 'next') return { breadcrumbTitle: 'New Scene', sceneFieldLabel: 'New scene description', showIdeas: true, showPreviousContext: true };
    return { breadcrumbTitle: 'Edit Scene', sceneFieldLabel: 'Scene description', showIdeas: false, showPreviousContext: false };
  }, [mode]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<1 | 2 | 3>(1);
  const [ideas, setIdeas] = useState<FirstSceneIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [sceneText, setSceneText] = useState('');
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [savingScene, setSavingScene] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState(mode === 'next' ? (projectId ?? '') : '');
  const [currentNodeId, setCurrentNodeId] = useState('');
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsGeneratedOnce, setActionsGeneratedOnce] = useState(false);
  const [generatedActions, setGeneratedActions] = useState<string[]>([]);
  const [savedActions, setSavedActions] = useState<WorkspaceAction[]>([]);
  const [actionDraft, setActionDraft] = useState('');
  const [addingAction, setAddingAction] = useState(false);

  const previousScene = useMemo(() => {
    if (!strategy.showPreviousContext || !contextProject?.workspace || !sceneId) return null;
    return contextProject.workspace.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null;
  }, [contextProject, sceneId, strategy.showPreviousContext]);

  const previousActionText = useMemo(() => {
    if (!previousScene || !actionId) return '';
    return previousScene.actions.find((action) => action.id === actionId)?.text ?? '';
  }, [actionId, previousScene]);

  const editableScene = useMemo(() => {
    if (mode !== 'edit' || !contextProject?.workspace || !sceneId) return null;
    return contextProject.workspace.nodes.find((node) => node.id.toUpperCase() === sceneId.toUpperCase()) ?? null;
  }, [contextProject, mode, sceneId]);

  useEffect(() => {
    let cancelled = false;
    const loadIdeas = async () => {
      try {
        setError(null);
        setLoadingIdeas(true);
        if (!strategy.showIdeas) {
          setIdeas([]);
          return;
        }
        const list = mode === 'first'
          ? await generateFirstSceneIdeas('')
          : await generateNextSceneIdeas(projectId ?? '', sceneId ?? '', actionId ?? '');
        if (!cancelled) setIdeas(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load scene ideas');
      } finally {
        if (!cancelled) setLoadingIdeas(false);
      }
    };
    void loadIdeas();
    return () => { cancelled = true; };
  }, [actionId, mode, projectId, sceneId, strategy.showIdeas]);

  useEffect(() => {
    if (mode !== 'edit' || !editableScene) return;
    setCurrentProjectId(projectId ?? '');
    setCurrentNodeId(editableScene.id);
    setSceneText(editableScene.stateDescription || editableScene.actionDescription || '');
    setSavedActions((editableScene.actions ?? []).filter((a) => (a.text ?? '').trim().length > 0));
    setGeneratedActions(editableScene.generatedActionsDraft ?? []);
    setActionsGeneratedOnce(true);
    setMaxUnlockedStep(2);
  }, [editableScene, mode, projectId]);

  const ensureSceneForFirst = async () => {
    const project = await createNodeGeneratorProject(buildProjectName(sceneText, selectedIdeaIndex, ideas), 'classic-adventure');
    const withNode = await createWorkspaceNode(project.id);
    setProjectCache(withNode);
    const node = withNode.workspace?.nodes[withNode.workspace.nodes.length - 1];
    if (!node) throw new Error('Failed to create first scene');
    return { projectId: withNode.id, nodeId: node.id };
  };

  const ensureSceneForNext = async () => {
    const updated = await createNextWorkspaceNode(projectId ?? '', sceneId ?? '', actionId ?? '');
    setProjectCache(updated);
    const node = updated.workspace?.nodes.find((item) => item.sourceNodeId === (sceneId ?? '') && item.sourceActionId === (actionId ?? ''))
      ?? updated.workspace?.nodes[updated.workspace.nodes.length - 1];
    if (!node) throw new Error('Failed to create new scene');
    return { projectId: updated.id, nodeId: node.id };
  };

  const ensureSceneForEdit = async () => {
    if (!(projectId ?? '').trim() || !(sceneId ?? '').trim()) throw new Error('Scene to edit was not found');
    return { projectId: projectId ?? '', nodeId: sceneId ?? '' };
  };

  const ensureScene = async () => {
    if (mode === 'first') return ensureSceneForFirst();
    if (mode === 'next') return ensureSceneForNext();
    return ensureSceneForEdit();
  };

  const handleContinueFromStep1 = async () => {
    if (!sceneText.trim() || savingScene) return;
    try {
      setError(null);
      setSavingScene(true);
      const created = await ensureScene();
      const updated = await updateWorkspaceNodeDescription(created.projectId, created.nodeId, sceneText.trim(), sceneText.trim());
      setProjectCache(updated);
      setCurrentProjectId(created.projectId);
      setCurrentNodeId(created.nodeId);
      setSavedActions([]);
      setGeneratedActions([]);
      setActionsGeneratedOnce(false);
      setMaxUnlockedStep(2);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save scene description');
    } finally {
      setSavingScene(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || actionsGeneratedOnce || !currentProjectId || !currentNodeId) return;
    let cancelled = false;
    const run = async () => {
      try {
        setError(null);
        setActionsLoading(true);
        const updated = await generateWorkspaceNodeActions(currentProjectId, currentNodeId);
        if (cancelled) return;
        setProjectCache(updated);
        const node = updated.workspace?.nodes.find((item) => item.id.toUpperCase() === currentNodeId.toUpperCase());
        setGeneratedActions(node?.generatedActionsDraft ?? []);
        setSavedActions(node?.actions.filter((item) => (item.text ?? '').trim().length > 0) ?? []);
        setActionsGeneratedOnce(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to generate actions');
      } finally {
        if (!cancelled) setActionsLoading(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [actionsGeneratedOnce, currentNodeId, currentProjectId, setProjectCache, step]);

  const handleAddAction = async (value: string, fromGenerated = false) => {
    const text = value.trim();
    if (!text || !currentProjectId || !currentNodeId || addingAction || actionsLoading) return;
    try {
      setError(null);
      setAddingAction(true);
      await addWorkspaceNodeAction(currentProjectId, currentNodeId, text);
      const refreshed = await getNodeGeneratorProject(currentProjectId);
      setProjectCache(refreshed);
      const node = refreshed.workspace?.nodes.find((item) => item.id.toUpperCase() === currentNodeId.toUpperCase());
      setSavedActions(node?.actions.filter((item) => (item.text ?? '').trim().length > 0) ?? []);
      if (fromGenerated) setGeneratedActions((prev) => prev.filter((item) => item !== text));
      setActionDraft('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add action');
    } finally {
      setAddingAction(false);
    }
  };

  const handleDeleteAction = async (actionIdValue: string) => {
    if (!currentProjectId || !currentNodeId || !actionIdValue) return;
    try {
      setError(null);
      const updated = await deleteWorkspaceNodeAction(currentProjectId, currentNodeId, actionIdValue);
      setProjectCache(updated);
      const node = updated.workspace?.nodes.find((item) => item.id.toUpperCase() === currentNodeId.toUpperCase());
      setSavedActions(node?.actions.filter((item) => (item.text ?? '').trim().length > 0) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete action');
    }
  };

  const handleFinishStep2 = async () => {
    if (!currentProjectId || !currentNodeId) return;
    if (actionDraft.trim()) {
      await handleAddAction(actionDraft);
    }
    setMaxUnlockedStep(3);
    setStep(3);
  };

  const availableGeneratedActions = useMemo(() => {
    const saved = new Set(savedActions.map((item) => item.text.trim().toLowerCase()).filter(Boolean));
    return generatedActions.filter((item) => !saved.has(item.trim().toLowerCase()));
  }, [generatedActions, savedActions]);

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Breadcrumbs aria-label="breadcrumb">
        <MuiLink component={Link} to="/node-generator" underline="hover" color="inherit">All quests</MuiLink>
        <Typography color="text.primary">{strategy.breadcrumbTitle}</Typography>
      </Breadcrumbs>

      <SectionCard title={`Create scene ${currentNodeId || 'N1'}`}>
        <Stepper activeStep={step - 1} alternativeLabel nonLinear>
          {STEPS.map((label, index) => (
            <Step key={label}>
              <StepButton onClick={() => { if ((index + 1) <= maxUnlockedStep) setStep((index + 1) as 1 | 2 | 3); }}>{label}</StepButton>
            </Step>
          ))}
        </Stepper>
      </SectionCard>

      {step === 1 ? (
        <SectionCard title="Step 1. Scene Description">
          <Stack spacing={1.5}>
            {strategy.showPreviousContext ? (
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Typography variant="subtitle2">Previous step context</Typography>
                <Typography variant="body2" color="text.secondary">Previous scene</Typography>
                <Typography variant="body2">{previousScene?.stateDescription || previousScene?.actionDescription || 'Description is unavailable.'}</Typography>
                <Typography variant="body2" color="text.secondary">Selected action</Typography>
                <Typography variant="body2">{previousActionText || 'Action is unavailable.'}</Typography>
              </Box>
            ) : null}

            <TextField label={strategy.sceneFieldLabel} value={sceneText} onChange={(e) => setSceneText(e.target.value)} fullWidth multiline minRows={4} />

            {strategy.showIdeas ? (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">AI suggestions</Typography>
                {loadingIdeas ? <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={16} /><Typography variant="body2" color="primary.main">Generating suggestions...</Typography></Stack> : null}
                {ideas.map((item, index) => (
                  <Box key={`${index}-${item.title}`} role="button" tabIndex={0} onClick={() => { setSelectedIdeaIndex(index); setSceneText(item.scenarioText); }} sx={{ border: 1, borderColor: selectedIdeaIndex === index ? 'primary.main' : 'primary.light', borderRadius: 1, p: 1, cursor: 'pointer', bgcolor: selectedIdeaIndex === index ? 'action.selected' : 'background.paper' }}>
                    <Typography variant="subtitle2">{item.title}</Typography>
                    <Typography variant="body2">{item.scenarioText}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : null}

            <Button variant="contained" onClick={() => void handleContinueFromStep1()} disabled={!sceneText.trim() || savingScene}>
              {savingScene ? 'Saving...' : 'Continue to Actions'}
            </Button>
          </Stack>
        </SectionCard>
      ) : null}

      {step === 2 ? (
        <SectionCard title="Step 2. Actions">
          <Stack spacing={1.5}>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <Typography variant="subtitle2">Selected scene description</Typography>
              <Typography variant="body2" color="text.secondary">{sceneText.trim() || 'No description selected.'}</Typography>
            </Box>
            {actionsLoading ? <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={16} /><Typography variant="body2" color="primary.main">Generating actions...</Typography></Stack> : null}
            <Stack spacing={1}>
              {availableGeneratedActions.map((item, index) => (
                <Box key={`${index}-${item}`} role="button" tabIndex={0} onClick={() => void handleAddAction(item, true)} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, cursor: 'pointer' }}>
                  <Typography variant="body2">{item}</Typography>
                </Box>
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Add action manually"
                value={actionDraft}
                onChange={(e) => setActionDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  void handleAddAction(actionDraft);
                }}
                fullWidth
                size="small"
                disabled={actionsLoading}
              />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">Added actions</Typography>
              {savedActions.map((item) => (
                <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">- {item.text}</Typography>
                  <Button size="small" color="error" variant="text" onClick={() => void handleDeleteAction(item.id)}>Delete</Button>
                </Stack>
              ))}
            </Stack>
            <Button variant="contained" onClick={() => void handleFinishStep2()} disabled={!currentProjectId || !currentNodeId || addingAction}>Done</Button>
          </Stack>
        </SectionCard>
      ) : null}

      {step === 3 ? (
        <SectionCard title="Step 3. Done">
          <Stack spacing={1}>
            <Typography variant="body2">Scene is ready.</Typography>
            <Button variant="contained" onClick={() => navigate(`/node-generator/projects/${currentProjectId}/scenes/${encodeURIComponent(currentNodeId)}`)} disabled={!currentProjectId || !currentNodeId}>Open Scene</Button>
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}

function buildProjectName(sceneText: string, selectedIdeaIndex: number | null, ideas: FirstSceneIdea[]): string {
  const ideaTitle = selectedIdeaIndex != null ? (ideas[selectedIdeaIndex]?.title ?? '').trim() : '';
  if (ideaTitle) return ideaTitle;
  const firstLine = sceneText.split('\n').map((line) => line.trim()).find((line) => line.length > 0) ?? '';
  if (!firstLine) return 'New Quest';
  return firstLine.length > 48 ? `${firstLine.slice(0, 48).trim()}...` : firstLine;
}

