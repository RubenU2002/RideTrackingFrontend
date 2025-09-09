import { api, authApi } from '@/core/api/client';
import { ApiError } from '@/core/api/types';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.resetAllMocks();
});

it('returns JSON on success', async () => {
  // @ts-expect-error mock
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ success: true, message: 'ok', data: { hello: 'world' } }),
  });

  const res = await api.get<{ success: boolean; message: string; data: { hello: string } }>(
    '/ping',
  );
  expect(res).toEqual({ success: true, message: 'ok', data: { hello: 'world' } });
});

it('throws ApiError with body on failure', async () => {
  const body = {
    success: false,
    message: 'Validation error',
    errors: [{ field: 'email', message: 'Debe ser un email válido' }],
  };

  // @ts-expect-error mock
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => body,
  });

  await expect(authApi.login('bad', 'x')).rejects.toBeInstanceOf(ApiError);

  // @ts-expect-error mock again for second call assertions
  global.fetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => body });
  await expect(authApi.login('bad', 'x')).rejects.toMatchObject({ status: 400 });

  // @ts-expect-error mock again for third call to inspect body
  global.fetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => body });
  await authApi.login('bad', 'x').catch((e) => {
    const err = e as ApiError;
    expect(err.body).toEqual(body);
    expect(err.message).toBe('Validation error');
  });
});
