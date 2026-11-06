import { expect, test } from '@playwright/test'

test('application form lays out actions without forwarding style props to the DOM', async ({
  page,
}) => {
  const reactWarnings: string[] = []

  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().includes('justifyContent')
    ) {
      reactWarnings.push(message.text())
    }
  })

  await page.route('**/api/v1/applicant-applications/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    })
  })

  await page.goto('/applications/prototype/personal-details')

  const nextButton = page.getByRole('button', { name: 'Next' })
  await expect(nextButton).toBeVisible()

  const actions = nextButton.locator('xpath=..')
  await expect(actions).toHaveCSS('justify-content', 'space-between')

  expect(reactWarnings).toEqual([])
})
