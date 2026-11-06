import { Alert, Button, Stack, Typography } from '@kyc/ui'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { api, type Application, type Resource } from '../-applicant-api'

import {
  ApplicantJourneyPresentation,
  type ApplicantJourneyProgressItem,
} from './-applicant-journey-presentation'

export default function CurrentApplicationJourneyPage() {
  const navigate = useNavigate()
  const [application, setApplication] = useState<Resource<Application>>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    void api<Resource<Application>>('/api/v1/applicant-applications/current')
      .then((result) => {
        if (active) setApplication(result)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not load your application.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  async function start() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result =
        application ??
        (await api<Resource<Application>>(
          '/api/v1/applicant-applications',
          'POST',
        ))
      if (!result?.data?.id)
        throw new Error('The server returned an invalid application.')
      void navigate(
        `/applications/${result.data.id}/${result.data.attributes.currentStep}`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not start the application.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (loading)
    return <Typography role="status">Loading your application…</Typography>
  if (error)
    return (
      <Stack spacing={2}>
        <Alert role="alert" severity="error">
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </Stack>
    )
  return (
    <Stack spacing={2}>
      <ApplicantJourneyPresentation
        entryState={application ? 'resume' : 'start'}
        progress={
          application?.data.attributes.progress.map(
            (item): ApplicantJourneyProgressItem => ({
              step:
                item.step === 'identity-and-address'
                  ? 'identity-and-address'
                  : 'personal-details',
              state: (['complete', 'current'].includes(item.state)
                ? item.state
                : 'remaining') as ApplicantJourneyProgressItem['state'],
            }),
          ) ?? [
            { step: 'personal-details', state: 'current' },
            { step: 'identity-and-address', state: 'remaining' },
          ]
        }
        onPrimaryAction={() => {
          void start()
        }}
      />
      {busy ? (
        <Typography role="status">Opening application…</Typography>
      ) : null}
    </Stack>
  )
}
