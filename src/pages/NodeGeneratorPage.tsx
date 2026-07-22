import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  ApiRequestError,
  addNodeKnowledgeToGlobal,
  addWorkspaceGlobalKnowledge,
  addWorkspaceNodeAction,
  createNextWorkspaceNode,
  createNodeGeneratorProject,
  createWorkspaceNode,
  deleteNodeGeneratorProject,
  deleteWorkspaceNode,
  exportProjectJson,
  extractWorkspaceNodeKnowledge,
  generateWorkspaceNodeActions,
  generateWorkspaceNodeDescription,
  getNodeGeneratorProject,
  getNodeGeneratorProjects,
  importNodeGeneratorProjectJson,
  previewWorkspaceNodeActionsPrompt,
  previewWorkspaceNodeDescriptionPrompt,
  previewWorkspaceNodeKnowledgePrompt,
  renameNodeGeneratorProject,
  removeWorkspaceGlobalKnowledge,
  runWorkspaceExpansion,
  updateWorkspaceNodeDescription,
} from '../api/nodeGeneratorApi';
import { EmptyState, LoadingState, SectionCard } from '../components/ui';
import type { NodeGeneratorProject, StagePromptPreview, WorkspaceNode } from '../types/nodeGenerator';

export function NodeGeneratorPage() {
  const [projects, setProjects] = useState<NodeGeneratorProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeActionDescriptionDraft, setNodeActionDescriptionDraft] = useState('');
  const [nodeStateDescriptionDraft, setNodeStateDescriptionDraft] = useState('');
  const [nodeActionDraft, setNodeActionDraft] = useState('');
  const [globalKnowledgeDraft, setGlobalKnowledgeDraft] = useState('');
  const [renameProjectNameDraft, setRenameProjectNameDraft] = useState('');
  const [workspacePromptPreviews, setWorkspacePromptPreviews] = useState<Record<string, StagePromptPreview>>({});

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const workspaceNodes = selectedProject?.workspace?.nodes ?? [];
  const selectedNode = useMemo(
    () => workspaceNodes.find((node) => node.id === selectedNodeId) ?? null,
    [workspaceNodes, selectedNodeId],
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

  const loadProjects = async () => {
    try {
      setLoading(true);
      clearUiError();
      const loaded = await getNodeGeneratorProjects();
      setProjects(loaded);
      if (!selectedProjectId && loaded.length > 0) setSelectedProjectId(loaded[0].id);
      if (selectedProjectId && !loaded.some((project) => project.id === selectedProjectId)) {
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

  useEffect(() => {
    if (!workspaceNodes.length) {
      setSelectedNodeId(null);
      setNodeActionDescriptionDraft('');
      setNodeStateDescriptionDraft('');
      return;
    }
    if (!selectedNodeId || !workspaceNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(workspaceNodes[0].id);
    }
  }, [workspaceNodes, selectedNodeId]);

  useEffect(() => {
    setNodeActionDescriptionDraft(selectedNode?.actionDescription ?? '');
    setNodeStateDescriptionDraft(selectedNode?.stateDescription ?? '');
  }, [selectedNode?.id, selectedNode?.actionDescription, selectedNode?.stateDescription]);

  useEffect(() => {
    setRenameProjectNameDraft(selectedProject?.name ?? '');
  }, [selectedProject?.id, selectedProject?.name]);

  const refreshSelectedProject = async (projectId: string) => {
    const refreshed = await getNodeGeneratorProject(projectId);
    setProjects((prev) => prev.map((project) => (project.id === refreshed.id ? refreshed : project)));
    setSelectedProjectId(refreshed.id);
    return refreshed;
  };

  const updateProject = (updated: NodeGeneratorProject) => {
    setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)));
  };

  const upsertProject = (updated: NodeGeneratorProject) => {
    setProjects((prev) => {
      const index = prev.findIndex((project) => project.id === updated.id);
      if (index < 0) return [updated, ...prev];
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const runAndRefresh = async (action: () => Promise<NodeGeneratorProject>, fallback: string): Promise<NodeGeneratorProject | null> => {
    if (!selectedProjectId) return null;
    try {
      clearUiError();
      const updated = await action();
      updateProject(updated);
      return updated;
    } catch (e) {
      applyUiError(e, fallback);
      await refreshSelectedProject(selectedProjectId);
      return null;
    }
  };

  const runPreview = async (action: () => Promise<StagePromptPreview>, key: string, fallback: string) => {
    if (!selectedProjectId) return;
    try {
      clearUiError();
      const preview = await action();
      setWorkspacePromptPreviews((prev) => ({ ...prev, [key]: preview }));
    } catch (e) {
      applyUiError(e, fallback);
      await refreshSelectedProject(selectedProjectId);
    }
  };

  const handleCreateProject = async () => {
    try {
      setBusyAction('create-project');
      clearUiError();
      const created = await createNodeGeneratorProject(generateProjectName(), 'classic-adventure');
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      setSelectedNodeId(null);
    } catch (e) {
      applyUiError(e, 'Не удалось создать проект');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateScene = async () => {
    if (!selectedProject) return;
    const previousIds = new Set((selectedProject.workspace?.nodes ?? []).map((node) => node.id));
    const updated = await runAndRefresh(
      () => createWorkspaceNode(selectedProject.id),
      'Не удалось создать сцену',
    );
    if (!updated) return;
    const created = (updated.workspace?.nodes ?? []).find((node) => !previousIds.has(node.id));
    if (created) setSelectedNodeId(created.id);
  };

  const handleCreateNextScene = async (actionId: string) => {
    if (!selectedProject || !selectedNode) return;
    const previousIds = new Set((selectedProject.workspace?.nodes ?? []).map((node) => node.id));
    const updated = await runAndRefresh(
      () => createNextWorkspaceNode(selectedProject.id, selectedNode.id, actionId),
      'Не удалось создать следующую сцену',
    );
    if (!updated) return;
    const created = (updated.workspace?.nodes ?? []).find((node) => !previousIds.has(node.id));
    if (created) setSelectedNodeId(created.id);
  };

  const handleExportJson = async () => {
    if (!selectedProjectId || !selectedProject) return;
    try {
      setBusyAction('export-json');
      clearUiError();
      const snapshot = await exportProjectJson(selectedProjectId);
      const jsonText = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = selectedProject.name.trim().replace(/[^a-zA-Z0-9_-]+/g, '_') || 'scene_generator_project';
      link.download = `${safeName}-scene-snapshot.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      applyUiError(e, 'Не удалось экспортировать JSON');
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportJsonFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (!file) return;
    try {
      setBusyAction('import-json');
      clearUiError();
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const updated = await importNodeGeneratorProjectJson(parsed);
      upsertProject(updated);
      setSelectedProjectId(updated.id);
    } catch (e) {
      applyUiError(e, 'Не удалось импортировать JSON');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRenameProject = async () => {
    if (!selectedProject) return;
    const name = renameProjectNameDraft.trim();
    if (!name) return;
    try {
      setBusyAction('rename-project');
      clearUiError();
      const updated = await renameNodeGeneratorProject(selectedProject.id, name);
      updateProject(updated);
    } catch (e) {
      applyUiError(e, 'Не удалось переименовать проект');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const isConfirmed = window.confirm(`Удалить проект "${selectedProject.name}"?`);
    if (!isConfirmed) return;
    try {
      setBusyAction('delete-project');
      clearUiError();
      await deleteNodeGeneratorProject(selectedProject.id);
      const removedProjectId = selectedProject.id;
      setProjects((prev) => {
        const next = prev.filter((project) => project.id !== removedProjectId);
        setSelectedProjectId(next[0]?.id ?? null);
        return next;
      });
      setSelectedNodeId(null);
    } catch (e) {
      applyUiError(e, 'Не удалось удалить проект');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) return <LoadingState message="Загрузка проектов генератора сцен..." />;

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

      <SectionCard title="Генератор сцен">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button variant="contained" onClick={() => void handleCreateProject()}>Новый проект</Button>
          <Button variant="outlined" onClick={() => void loadProjects()}>Обновить список</Button>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Проектов: {projects.length}
          </Typography>
        </Stack>
        {selectedProject ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
            <TextField
              size="small"
              label="Имя проекта"
              value={renameProjectNameDraft}
              onChange={(event) => setRenameProjectNameDraft(event.target.value)}
              sx={{ minWidth: { md: 320 } }}
            />
            <Button variant="outlined" onClick={() => void handleRenameProject()} disabled={!renameProjectNameDraft.trim()}>
              Переименовать
            </Button>
            <Button variant="outlined" color="error" onClick={() => void handleDeleteProject()}>
              Удалить проект
            </Button>
          </Stack>
        ) : null}
      </SectionCard>

      <SectionCard title="Шаг 1. Выберите проект">
        {!projects.length ? <EmptyState message="Пока нет проектов." /> : null}
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
                border: 1,
                borderColor: selectedProjectId === project.id ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: 1.25,
                cursor: 'pointer',
                bgcolor: selectedProjectId === project.id ? 'action.selected' : 'background.paper',
              }}
            >
              <Typography variant="subtitle1">{project.name}</Typography>
              <Typography variant="body2" color="text.secondary">Стиль: {project.questStyle}</Typography>
            </Box>
          ))}
        </Stack>
      </SectionCard>

      {selectedProject ? (
        <SectionCard
          title={`Шаг 2. Работа со сценами: ${selectedProject.name}`}
          action={(
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => void handleExportJson()}>Экспорт JSON</Button>
              <Button size="small" variant="contained" component="label">
                Импорт JSON
                <input hidden type="file" accept=".json,application/json" onChange={(event) => void handleImportJsonFile(event)} />
              </Button>
            </Stack>
          )}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Stack spacing={1} sx={{ minWidth: { md: 300 }, maxWidth: { md: 380 } }}>
              <Typography variant="body2" color="text.secondary">
                Сцен: {workspaceNodes.length}
              </Typography>
              <Button size="small" variant="contained" onClick={() => void handleCreateScene()}>
                Создать корневую сцену
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => void runAndRefresh(
                  () => runWorkspaceExpansion(selectedProject.id, selectedProject.workspace?.globalKnowledge ?? []),
                  'Не удалось обновить сцены по новым знаниям',
                )}
              >
                Обновить сцены по новым знаниям
              </Button>
              <Divider />
              <Typography variant="subtitle2">Дерево сцен</Typography>
              {!workspaceNodes.length ? (
                <Typography variant="body2" color="text.secondary">Сцен пока нет.</Typography>
              ) : null}
              <NodeTreeList nodes={workspaceNodes} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
            </Stack>

            <Stack spacing={1.25} sx={{ flex: 1 }}>
              {!selectedNode ? (
                <Typography variant="body2" color="text.secondary">Выберите сцену в дереве слева.</Typography>
              ) : (
                <>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">Сцена {selectedNode.id}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => void runAndRefresh(
                        () => deleteWorkspaceNode(selectedProject.id, selectedNode.id),
                        'Не удалось удалить сцену',
                      )}
                    >
                      Удалить сцену с дочерними
                    </Button>
                  </Stack>

                  <Typography variant="subtitle2">Шаг 2.1 Описание сцены</Typography>
                  <TextField
                    label="Описание действия (что делает игрок)"
                    value={nodeActionDescriptionDraft}
                    onChange={(e) => setNodeActionDescriptionDraft(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                  <TextField
                    label="Описание состояния (что видит игрок после действия)"
                    value={nodeStateDescriptionDraft}
                    onChange={(e) => setNodeStateDescriptionDraft(e.target.value)}
                    fullWidth
                    multiline
                    minRows={4}
                  />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => void runPreview(
                        () => previewWorkspaceNodeDescriptionPrompt(selectedProject.id, selectedNode.id),
                        `DESC:${selectedNode.id}`,
                        'Не удалось получить запрос',
                      )}
                    >
                      Описание: посмотреть запрос
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => void runAndRefresh(
                        () => generateWorkspaceNodeDescription(selectedProject.id, selectedNode.id),
                        'Не удалось запросить описание',
                      )}
                    >
                      Описание: запросить
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!nodeActionDescriptionDraft.trim() && !nodeStateDescriptionDraft.trim()}
                      onClick={() => void runAndRefresh(
                        () => updateWorkspaceNodeDescription(
                          selectedProject.id,
                          selectedNode.id,
                          nodeActionDescriptionDraft,
                          nodeStateDescriptionDraft,
                        ),
                        'Не удалось сохранить описание',
                      )}
                    >
                      Описание: сохранить
                    </Button>
                  </Stack>
                  {workspacePromptPreviews[`DESC:${selectedNode.id}`] ? (
                    <Box component="pre" sx={preSx}>
                      {`SYSTEM:\n${workspacePromptPreviews[`DESC:${selectedNode.id}`]?.systemPrompt ?? ''}\n\nUSER:\n${workspacePromptPreviews[`DESC:${selectedNode.id}`]?.userPrompt ?? ''}`}
                    </Box>
                  ) : null}
                  {(selectedNode.generatedActionDescriptionDraft?.trim() || selectedNode.generatedStateDescriptionDraft?.trim()) ? (
                    <Box sx={draftSx}>
                      <Typography variant="caption" color="text.secondary">Сгенерированный черновик</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>Действие: {selectedNode.generatedActionDescriptionDraft || '-'}</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>Состояние: {selectedNode.generatedStateDescriptionDraft || '-'}</Typography>
                      <Button
                        size="small"
                        variant="text"
                        sx={{ mt: 0.5 }}
                        onClick={() => {
                          setNodeActionDescriptionDraft(selectedNode.generatedActionDescriptionDraft ?? '');
                          setNodeStateDescriptionDraft(selectedNode.generatedStateDescriptionDraft ?? '');
                        }}
                      >
                        Подставить в поля
                      </Button>
                    </Box>
                  ) : null}

                  <Divider />
                  <Typography variant="subtitle2">Шаг 2.2 Знания и действия</Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => void runPreview(
                        () => previewWorkspaceNodeKnowledgePrompt(selectedProject.id, selectedNode.id),
                        `KNOW:${selectedNode.id}`,
                        'Не удалось получить запрос',
                      )}
                    >
                      Знания: посмотреть запрос
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => void runAndRefresh(
                        () => extractWorkspaceNodeKnowledge(selectedProject.id, selectedNode.id),
                        'Не удалось запросить знания',
                      )}
                    >
                      Знания: запросить
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => void runPreview(
                        () => previewWorkspaceNodeActionsPrompt(selectedProject.id, selectedNode.id),
                        `ACT:${selectedNode.id}`,
                        'Не удалось получить запрос',
                      )}
                    >
                      Действия: посмотреть запрос
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => void runAndRefresh(
                        () => generateWorkspaceNodeActions(selectedProject.id, selectedNode.id),
                        'Не удалось запросить действия',
                      )}
                    >
                      Действия: запросить
                    </Button>
                  </Stack>
                  {workspacePromptPreviews[`KNOW:${selectedNode.id}`] ? (
                    <Box component="pre" sx={preSx}>
                      {`SYSTEM:\n${workspacePromptPreviews[`KNOW:${selectedNode.id}`]?.systemPrompt ?? ''}\n\nUSER:\n${workspacePromptPreviews[`KNOW:${selectedNode.id}`]?.userPrompt ?? ''}`}
                    </Box>
                  ) : null}
                  {workspacePromptPreviews[`ACT:${selectedNode.id}`] ? (
                    <Box component="pre" sx={preSx}>
                      {`SYSTEM:\n${workspacePromptPreviews[`ACT:${selectedNode.id}`]?.systemPrompt ?? ''}\n\nUSER:\n${workspacePromptPreviews[`ACT:${selectedNode.id}`]?.userPrompt ?? ''}`}
                    </Box>
                  ) : null}

                  {selectedNode.extractedKnowledgeDraft?.length ? (
                    <Box sx={draftSx}>
                      <Typography variant="caption" color="text.secondary">Черновик знаний</Typography>
                      <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                        {selectedNode.extractedKnowledgeDraft.map((item, index) => (
                          <Stack key={`${index}-${item}`} direction="row" spacing={1}>
                            <Typography variant="body2" sx={{ flex: 1 }}>{index + 1}. {item}</Typography>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => void runAndRefresh(
                                () => addNodeKnowledgeToGlobal(selectedProject.id, selectedNode.id, item),
                                'Не удалось добавить знание',
                              )}
                            >
                              В глобальные знания
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}

                  <Typography variant="subtitle2">Шаг 2.3 Действия сцены</Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                    <TextField
                      label="Новое действие"
                      size="small"
                      value={nodeActionDraft}
                      onChange={(event) => setNodeActionDraft(event.target.value)}
                      fullWidth
                    />
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!nodeActionDraft.trim()}
                      onClick={() => void runAndRefresh(
                        () => addWorkspaceNodeAction(selectedProject.id, selectedNode.id, nodeActionDraft),
                        'Не удалось добавить действие',
                      )}
                    >
                      Добавить
                    </Button>
                  </Stack>
                  {selectedNode.generatedActionsDraft?.length ? (
                    <Box sx={draftSx}>
                      <Typography variant="caption" color="text.secondary">Сгенерированные действия</Typography>
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {selectedNode.generatedActionsDraft.map((draftText, index) => (
                          <Stack key={`${index}-${draftText}`} direction="row" spacing={1}>
                            <Typography variant="body2" sx={{ flex: 1 }}>{draftText}</Typography>
                            <Button size="small" variant="text" onClick={() => setNodeActionDraft(draftText)}>
                              Подставить
                            </Button>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  ) : null}
                  <Stack spacing={0.75}>
                    {selectedNode.actions.map((action) => (
                      <Box key={action.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        <Typography variant="caption" color="text.secondary">{action.id}</Typography>
                        <Typography variant="body2">{action.text}</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                          onClick={() => void handleCreateNextScene(action.id)}
                        >
                          Создать следующую сцену
                        </Button>
                      </Box>
                    ))}
                    {!selectedNode.actions.length ? <Typography variant="body2" color="text.secondary">Нет действий.</Typography> : null}
                  </Stack>
                </>
              )}
            </Stack>
          </Stack>
        </SectionCard>
      ) : null}

      {selectedProject ? (
        <SectionCard title="Шаг 3. Глобальные знания мира">
          <Stack spacing={1}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                label="Новое знание"
                size="small"
                value={globalKnowledgeDraft}
                onChange={(event) => setGlobalKnowledgeDraft(event.target.value)}
                fullWidth
              />
              <Button
                size="small"
                variant="contained"
                disabled={!globalKnowledgeDraft.trim()}
                onClick={() => void runAndRefresh(
                  () => addWorkspaceGlobalKnowledge(selectedProject.id, globalKnowledgeDraft),
                  'Не удалось добавить знание',
                )}
              >
                Добавить
              </Button>
            </Stack>
            <Stack spacing={0.5}>
              {(selectedProject.workspace?.globalKnowledge ?? []).map((item, index) => (
                <Stack key={`${index}-${item}`} direction="row" spacing={1}>
                  <Typography variant="body2" sx={{ flex: 1 }}>{index + 1}. {item}</Typography>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    onClick={() => void runAndRefresh(
                      () => removeWorkspaceGlobalKnowledge(selectedProject.id, item),
                      'Не удалось удалить знание',
                    )}
                  >
                    Удалить
                  </Button>
                </Stack>
              ))}
              {!(selectedProject.workspace?.globalKnowledge?.length) ? (
                <Typography variant="body2" color="text.secondary">Список глобальных знаний пуст.</Typography>
              ) : null}
            </Stack>
          </Stack>
        </SectionCard>
      ) : null}
    </Stack>
  );
}

const preSx = {
  mt: 0,
  mb: 0,
  p: 1,
  borderRadius: 1,
  bgcolor: 'background.default',
  maxHeight: 220,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontSize: 12,
} as const;

const draftSx = {
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  p: 1,
} as const;

type NodeTreeListProps = {
  nodes: WorkspaceNode[];
  selectedNodeId: string | null;
  onSelectNode: (_nodeId: string) => void;
};

function NodeTreeList({ nodes, selectedNodeId, onSelectNode }: NodeTreeListProps) {
  const byParent = new Map<string, WorkspaceNode[]>();
  const roots: WorkspaceNode[] = [];

  nodes.forEach((node) => {
    const parentId = (node.sourceNodeId ?? '').trim();
    if (!parentId) {
      roots.push(node);
      return;
    }
    const key = parentId.toUpperCase();
    const list = byParent.get(key) ?? [];
    list.push(node);
    byParent.set(key, list);
  });

  roots.sort((a, b) => a.id.localeCompare(b.id));
  byParent.forEach((list) => list.sort((a, b) => a.id.localeCompare(b.id)));

  const renderNode = (node: WorkspaceNode, level: number) => {
    const children = byParent.get(node.id.toUpperCase()) ?? [];
    const groupedByAction = new Map<string, WorkspaceNode[]>();
    children.forEach((child) => {
      const actionKey = (child.sourceActionId ?? 'NO_ACTION').toUpperCase();
      const list = groupedByAction.get(actionKey) ?? [];
      list.push(child);
      groupedByAction.set(actionKey, list);
    });
    const actionOrder = Array.from(groupedByAction.keys()).sort();

    return (
      <Box key={node.id} sx={{ ml: level * 1.25 }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => onSelectNode(node.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') onSelectNode(node.id);
          }}
          sx={{
            border: 1,
            borderColor: selectedNodeId === node.id ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 1,
            cursor: 'pointer',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{node.id}</Typography>
          <Typography variant="caption" color="text.secondary">действий: {node.actions.length}</Typography>
        </Box>
        {actionOrder.map((actionId) => {
          const actionText = node.actions.find((action) => action.id.toUpperCase() === actionId)?.text ?? actionId;
          const groupedChildren = groupedByAction.get(actionId) ?? [];
          return (
            <Box key={`${node.id}-${actionId}`} sx={{ mt: 0.5, ml: 1 }}>
              <Typography variant="caption" color="text.secondary">из действия: {actionText}</Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {groupedChildren.map((child) => renderNode(child, level + 1))}
              </Stack>
            </Box>
          );
        })}
      </Box>
    );
  };

  return <Stack spacing={0.75}>{roots.map((root) => renderNode(root, 0))}</Stack>;
}

function generateProjectName(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `Сцена-проект ${date} ${time}`;
}
