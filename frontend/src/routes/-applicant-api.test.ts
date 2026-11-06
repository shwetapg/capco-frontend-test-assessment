import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiFailure, credentials, MEDIA } from './-applicant-api'

afterEach(() => vi.unstubAllGlobals())
describe('applicant API', () => {
  it('sends JSON:API credentials with cookies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => '',
    })
    vi.stubGlobal('fetch', fetchMock)
    await api(
      '/api/v1/applicant-accounts',
      'POST',
      credentials('applicant-accounts', ' user@example.com ', 'Password!'),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/applicant-accounts',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Accept: MEDIA,
          'Content-Type': MEDIA,
        }),
        body: JSON.stringify(
          credentials('applicant-accounts', ' user@example.com ', 'Password!'),
        ),
      }),
    )
  })
  it('reports rate limiting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    )
    await expect(api('/api/v1/applicant-sessions')).rejects.toMatchObject({
      status: 429,
    })
  })
  it('reports network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(api('/api/v1/applicant-sessions')).rejects.toBeInstanceOf(
      ApiFailure,
    )
  })
})
