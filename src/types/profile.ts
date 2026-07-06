export interface UserProfile {
  id: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  displayName: string;
}
