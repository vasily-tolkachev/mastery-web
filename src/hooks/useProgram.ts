import { useQuery } from '@tanstack/react-query';
import { getCurrentProgram, getProgramById, getProgramStatus, getProgramTree } from '../api/programApi';
import type { ProgramGenerationStatus } from '../types/program';

const CURRENT_PROGRAM_QUERY_KEY = ['current-program'];
const PROGRAM_QUERY_KEY = (programId: number) => ['program', programId];
const PROGRAM_TREE_QUERY_KEY = (programId: number) => ['program-tree', programId];
const PROGRAM_STATUS_QUERY_KEY = (programId: number) => ['program-status', programId];

export function useCurrentProgram() {
  return useQuery({
    queryKey: CURRENT_PROGRAM_QUERY_KEY,
    queryFn: () => getCurrentProgram(),
  });
}

export function useProgram(programId: number) {
  return useQuery({
    queryKey: PROGRAM_QUERY_KEY(programId),
    queryFn: () => getProgramById(programId),
    enabled: programId > 0,
  });
}

export function useProgramTree(programId: number) {
  return useQuery({
    queryKey: PROGRAM_TREE_QUERY_KEY(programId),
    queryFn: () => getProgramTree(programId),
    enabled: programId > 0,
  });
}

export function useProgramStatus(programId: number, pollingEnabled = true) {
  return useQuery({
    queryKey: PROGRAM_STATUS_QUERY_KEY(programId),
    queryFn: () => getProgramStatus(programId),
    enabled: programId > 0 && pollingEnabled,
    refetchInterval: (query) => {
      const data = query.state.data as ProgramGenerationStatus | null | undefined;
      if (!data) return 1500;
      return data.status === 'READY' || data.status === 'FAILED' ? false : 1500;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
