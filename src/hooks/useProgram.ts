import { useQuery } from '@tanstack/react-query';
import { getCurrentProgram } from '../api/programApi';

const CURRENT_PROGRAM_QUERY_KEY = (userId: string) => ['current-program', userId];

export function useCurrentProgram(userId: string) {
  return useQuery({
    queryKey: CURRENT_PROGRAM_QUERY_KEY(userId),
    queryFn: () => getCurrentProgram(userId),
  });
}
