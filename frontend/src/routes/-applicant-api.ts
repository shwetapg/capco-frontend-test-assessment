export const MEDIA = 'application/vnd.api+json'

export class ApiFailure extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function csrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((part) => part.startsWith('XSRF-TOKEN='))
    ?.split('=')
    .slice(1)
    .join('=')
}

export async function api<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T | undefined> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      credentials: 'include',
      headers: {
        Accept: MEDIA,
        ...(body === undefined ? {} : { 'Content-Type': MEDIA }),
        ...(['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && csrfToken()
          ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfToken()!) }
          : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new ApiFailure(0, 'Network connection failed. Please try again.')
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Please check the information entered.',
      401: 'Your session has expired. Please sign in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested application was not found.',
      409: 'This information has changed. Refresh the page before saving again.',
      422: 'Some values are invalid. Please review your answers.',
      429: 'Too many attempts. Please wait and try again.',
    }
    throw new ApiFailure(
      response.status,
      messages[response.status] ?? 'Something went wrong. Please try again.',
    )
  }
  if (response.status === 204) return undefined

  try {
    const responseText = await response.text()

    // Successful responses may have no body
    if (!responseText.trim()) {
      return undefined
    }

    return JSON.parse(responseText) as T
  } catch {
    throw new ApiFailure(
      response.status,
      'The server returned an unexpected response.',
    )
  }
}

export type Resource<T> = { data: { id: string; type: string; attributes: T } }
export type Answers = Record<string, string | boolean | null>
export type FormState = {
  answers: Answers
  version?: number
  currentStep: string
}
export type Application = {
  href: string
  currentStep: string
  progress: { step: string; state: string }[]
}
export const credentials = (type: string, email: string, password: string) => ({
  data: { type, attributes: { email: email.trim(), password } },
})
