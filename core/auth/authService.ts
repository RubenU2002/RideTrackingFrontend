import { authApi } from '@/core/api/client';
import type { User } from '@/core/api/types';
import { deleteToken, saveToken, setMemoryToken } from '@/core/auth/tokenStorage';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const res = await authApi.login(email, password);
    await saveToken(res.data.token);
    setMemoryToken(res.data.token);
    return res.data.user;
  },

  async logout(): Promise<void> {
    await deleteToken();
  },

  async getProfile(): Promise<User> {
    const me = await authApi.profile();
    return me.data;
  },

  async register(name: string, email: string, phone: string, password: string): Promise<User> {
    const res = await authApi.register(name, email, phone, password);
    return res.data.user;
  },
};
