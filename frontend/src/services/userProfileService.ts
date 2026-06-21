import apiClient from './apiClient';
import type { ApiResponse, User } from '@/types';

export const userProfileService = {
  /** 닉네임 수정 */
  patchNickname: (nickname: string) =>
    apiClient.patch<ApiResponse<User>>('/user/me/nickname', { nickname }),
};
