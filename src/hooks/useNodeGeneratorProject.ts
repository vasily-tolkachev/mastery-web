import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNodeGeneratorProject } from '../api/nodeGeneratorApi';
import type { NodeGeneratorProject } from '../types/nodeGenerator';

export const nodeGeneratorProjectQueryKey = (projectId: string) => ['node-generator-project', projectId] as const;

const PROJECT_STALE_TIME_MS = 60_000;

export function useNodeGeneratorProject(projectId: string) {
  return useQuery({
    queryKey: nodeGeneratorProjectQueryKey(projectId),
    queryFn: () => getNodeGeneratorProject(projectId),
    enabled: Boolean(projectId),
    staleTime: PROJECT_STALE_TIME_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useSetNodeGeneratorProjectCache() {
  const queryClient = useQueryClient();
  return (project: NodeGeneratorProject) => {
    queryClient.setQueryData(nodeGeneratorProjectQueryKey(project.id), project);
  };
}
