import { authApi } from '@/core/api/client';
import { authService } from '@/core/auth/authService';
import * as token from '@/core/auth/tokenStorage';

jest.mock('@/core/api/client', () => ({
  authApi: {
    login: jest.fn(),
    profile: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('@/core/auth/tokenStorage', () => ({
  saveToken: jest.fn(),
  deleteToken: jest.fn(),
  setMemoryToken: jest.fn(),
}));

describe('authService', () => {
  it('login saves token and returns user', async () => {
    const user = { id: '1', name: 'A', email: 'a@a.com', phone: '1' };
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      data: { user, token: 't', tokenType: 'Bearer' },
      success: true,
      message: 'ok',
    });

    const u = await authService.login('a@a.com', 'x');
    expect(token.saveToken).toHaveBeenCalledWith('t');
    expect(token.setMemoryToken).toHaveBeenCalledWith('t');
    expect(u).toEqual(user);
  });

  it('logout deletes token', async () => {
    await authService.logout();
    expect(token.deleteToken).toHaveBeenCalled();
  });

  it('getProfile returns user', async () => {
    const user = { id: '1', name: 'B', email: 'b@b.com', phone: '2' };
    (authApi.profile as jest.Mock).mockResolvedValueOnce({
      data: user,
      success: true,
      message: 'ok',
    });
    const u = await authService.getProfile();
    expect(u).toEqual(user);
  });
});
