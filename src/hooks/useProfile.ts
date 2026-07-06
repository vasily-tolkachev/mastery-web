import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../api/profileApi';
import type { UpdateUserProfileRequest, UserProfile } from '../types/profile';

const PROFILE_QUERY_KEY = ['profile'];

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserProfileRequest) => updateProfile(payload),
    onSuccess: (profile: UserProfile) => {
      queryClient.setQueryData<UserProfile>(PROFILE_QUERY_KEY, profile);
    },
  });
}
