import {
  Alert,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography,
} from '@kyc/ui'
import { useEffect, useRef, useState } from 'react'

import { api, ApiFailure, credentials } from './-applicant-api'
import { accountAccessHref } from './-return-target'
import styles from './account-access.module.css'

export interface CreateAccountFormProps {
  onNavigate?: (href: string) => void
  returnTo?: string
}

const passwordGuidance =
  'Use at least six characters, including one uppercase letter and one special character.'

export function CreateAccountForm({
  onNavigate,
  returnTo,
}: CreateAccountFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const emailInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (emailError) {
      emailInput.current?.focus()
    } else if (passwordError) {
      passwordInput.current?.focus()
    }
  }, [emailError, passwordError])

  async function submit(): Promise<void> {
    if (pending) return
    setError(undefined)
    setEmailError(undefined)
    setPasswordError(undefined)
    setSuccessMessage(undefined)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.')
      return
    }
    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[^a-zA-Z0-9]/.test(password)
    ) {
      setPasswordError(passwordGuidance)
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }
    setPending(true)
    try {
      await api(
        '/api/v1/applicant-accounts',
        'POST',
        credentials('applicant-accounts', email, password),
      )
      setPassword('')
      setConfirmation('')
      setSuccessMessage(
        'Your account was created successfully. You can now sign in.',
      )
    } catch (cause) {
      let message = 'Registration failed. Please try again.'

      if (cause instanceof ApiFailure) {
        message =
          cause.status === 409
            ? 'An account with this email already exists.'
            : cause.message
      } else if (cause instanceof Error) {
        message = cause.message
      }

      setError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <CardContent className={styles.cardContent}>
          <Stack
            component="form"
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
            spacing={3}
          >
            <Stack spacing={1}>
              <Typography component="h1" variant="heading">
                Create your account
              </Typography>
              <Typography tone="muted">
                Create credentials to begin your KYC application.
              </Typography>
            </Stack>
            {(error ?? emailError ?? passwordError) ? (
              <Alert aria-live="assertive" role="alert" severity="error">
                {error ?? emailError ?? passwordError}
              </Alert>
            ) : null}
            {successMessage ? (
              <Alert aria-live="polite" role="status" severity="success">
                {successMessage}
              </Alert>
            ) : null}
            <TextField
              autoComplete="email"
              error={Boolean(emailError)}
              fullWidth
              helperText={emailError}
              id="applicant-email"
              inputRef={emailInput}
              label="Email address"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailError(undefined)
              }}
              required
              type="email"
              value={email}
            />
            <TextField
              autoComplete="new-password"
              error={Boolean(passwordError)}
              fullWidth
              helperText={passwordError ?? passwordGuidance}
              id="applicant-password"
              inputRef={passwordInput}
              label="Password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value)
                setPasswordError(undefined)
              }}
              required
              type="password"
              value={password}
            />
            <TextField
              autoComplete="new-password"
              fullWidth
              id="confirm-password"
              label="Confirm password"
              name="confirmPassword"
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type="password"
              value={confirmation}
            />
            <Button
              disabled={pending}
              className={styles.submit}
              fullWidth
              size="large"
              type="submit"
            >
              {pending ? 'Creating account…' : 'Create account'}
            </Button>
            <Typography
              className={styles.footer}
              align="center"
              variant="caption"
            >
              <span>Already have an account? </span>
              <Link
                href={accountAccessHref('/sign-in', returnTo)}
                onClick={(event) => {
                  if (onNavigate) {
                    event.preventDefault()
                    onNavigate(accountAccessHref('/sign-in', returnTo))
                  }
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </main>
  )
}
