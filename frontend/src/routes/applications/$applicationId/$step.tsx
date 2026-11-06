import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@kyc/ui'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import {
  api,
  type Answers,
  type FormState,
  type Resource,
} from '../../-applicant-api'
import styles from '../../application-step.module.css'

import type { Route } from './+types/$step'

const fields = {
  'personal-details': {
    name: 'Name',
    dateOfBirth: 'Date of birth',
    country: 'Country',
    nationality: 'Nationality',
    email: 'Email',
    phone: 'Phone',
  },
  'identity-and-address': {
    documentType: 'Document type',
    documentNumber: 'Document number',
    documentCountry: 'Document country',
    expiry: 'Expiry',
    street: 'Street',
    city: 'City',
    postal: 'Postal code',
    residentialCountry: 'Residential country',
  },
} as const

export default function CurrentApplicationStepPage({
  params,
}: Route.ComponentProps) {
  const navigate = useNavigate()
  const step =
    params.step === 'identity-and-address'
      ? 'identity-and-address'
      : 'personal-details'
  const [answers, setAnswers] = useState<Answers>({})
  const [version, setVersion] = useState<number>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const path = `/api/v1/applicant-applications/${encodeURIComponent(params.applicationId)}/form`
  useEffect(() => {
    let active = true

    void api<Resource<FormState>>(path)
      .then((result) => {
        if (!active) return

        if (result) {
          setAnswers(result.data.attributes.answers ?? {})
          setVersion(result.data.attributes.version)
        }
      })
      .catch((cause: unknown) => {
        if (!active) return

        setError(
          cause instanceof Error ? cause.message : 'Could not load your draft.',
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [path])
  const update = (key: string, value: string | boolean) => {
    setAnswers((previous) => ({ ...previous, [key]: value }))
    setSaved(false)
  }
  async function save() {
    if (saving) return
    setSaving(true)
    setSaved(false)
    setError('')
    const stepAnswers: Answers = {}
    for (const key of Object.keys(fields[step]))
      if (answers[key] !== undefined) stepAnswers[key] = answers[key]
    if (step === 'personal-details')
      stepAnswers.consentConfirmed = answers.consentConfirmed ?? false
    try {
      const result = await api<Resource<FormState>>(path, 'PATCH', {
        data: {
          type: 'applicant-application-forms',
          id: params.applicationId,
          attributes: {
            step,
            answers: stepAnswers,
            ...(version === undefined ? {} : { version }),
          },
        },
      })
      if (!result?.data?.attributes)
        throw new Error('The server did not confirm the save.')
      setVersion(result.data.attributes.version)
      setSaved(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not save. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }
  if (params.step === 'review')
    return (
      <main className={styles.reviewPage}>
        <Card className={styles.reviewCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography component="h1" variant="heading">
                Review application
              </Typography>
              <Typography>
                Review your saved answers before submitting. Submission is not
                part of this assessment.
              </Typography>
              <Button
                onClick={() =>
                  void navigate(
                    `/applications/${params.applicationId}/identity-and-address`,
                  )
                }
              >
                Return to form
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </main>
    )
  return (
    <main className={styles.page}>
      <Box component="div" className={styles.stepContent}>
        <Stack spacing={3}>
          <Typography component="p" variant="eyebrow" tone="accent">
            STEP {step === 'personal-details' ? '1' : '2'} OF 2
          </Typography>
          <Typography component="h1" variant="heading">
            {step === 'personal-details'
              ? 'Personal details'
              : 'Identity and address'}
          </Typography>
          <Typography tone="muted">
            Your answers are saved to your account when you select Save.
          </Typography>
          {loading ? (
            <Typography role="status">Loading saved answers…</Typography>
          ) : (
            <Stack
              component="form"
              className={styles.stepForm}
              onSubmit={(event) => {
                event.preventDefault()
                void save()
              }}
              spacing={2}
            >
              {Object.entries(fields[step]).map(([key, label]) => (
                <TextField
                  key={key}
                  id={`field-${key}`}
                  name={key}
                  label={label}
                  value={String(answers[key] ?? '')}
                  onChange={(event) => update(key, event.target.value)}
                />
              ))}
              {step === 'personal-details' ? (
                <label>
                  <input
                    type="checkbox"
                    checked={answers.consentConfirmed === true}
                    onChange={(event) =>
                      update('consentConfirmed', event.target.checked)
                    }
                  />{' '}
                  I confirm these details are accurate and belong to me.
                </label>
              ) : null}
              {error ? (
                <Alert role="alert" severity="error">
                  {error}
                </Alert>
              ) : null}
              {saved ? (
                <Alert role="status" severity="success">
                  Your changes have been saved.
                </Alert>
              ) : null}
              <Stack
                component="div"
                className={styles.formActions}
                direction="row"
                spacing={2}
              >
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() =>
                    void navigate(
                      step === 'personal-details'
                        ? '/applications/current'
                        : `/applications/${params.applicationId}/personal-details`,
                    )
                  }
                >
                  Back
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    void navigate(
                      `/applications/${params.applicationId}/${step === 'personal-details' ? 'identity-and-address' : 'review'}`,
                    )
                  }
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    </main>
  )
}
