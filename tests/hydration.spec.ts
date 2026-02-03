/**
 * HYDRATION GATE TEST
 * 
 * This is the Mechanical Gate for Week 2.
 * Signals UI work is BLOCKED until this test passes GREEN.
 * 
 * Test: Draft Persistence Through Refresh
 * 1. Load Morning Briefing
 * 2. Select a target
 * 3. Edit draft subject/body
 * 4. Save
 * 5. Hard refresh
 * 6. Assert: Draft content persists
 */

import { test, expect } from '@playwright/test'

test.describe('Hydration Gate', () => {
    test('Draft persistence through page refresh', async ({ page }) => {
        // 1. Navigate to Morning Briefing (root route renders AppShell with MorningBriefingDashboard)
        await page.goto('/')

        // Wait for the queue to load
        await page.waitForSelector('[data-testid="queue-sidebar"]', { timeout: 30000 })

        // 2. Select the first target card
        const firstTargetCard = page.locator('[data-testid="target-card"]').first()
        await firstTargetCard.click()

        // Wait for draft panel to load
        await page.waitForSelector('[data-testid="draft-workspace"]', { timeout: 10000 })

        // 3. Click Edit button to enter editing mode
        await page.click('[data-testid="edit-button"]')

        // Generate unique test content
        const testSubject = `Test Subject ${Date.now()}`
        const testBody = `Test Body Content ${Date.now()}\n\nThis is a test of the hydration persistence.`

        // Clear and fill the subject input
        const subjectInput = page.locator('[data-testid="subject-input"]')
        await subjectInput.clear()
        await subjectInput.fill(testSubject)

        // Clear and fill the body textarea
        const bodyTextarea = page.locator('[data-testid="body-textarea"]')
        await bodyTextarea.clear()
        await bodyTextarea.fill(testBody)

        // 4. Save the edit
        await page.click('[data-testid="save-button"]')

        // Wait for save to complete (toast or button state change)
        await page.waitForTimeout(2000)

        // 5. Hard refresh the page
        await page.reload()

        // Wait for the queue to reload
        await page.waitForSelector('[data-testid="queue-sidebar"]', { timeout: 30000 })

        // 6. Re-select the first target (should be the same one)
        await page.locator('[data-testid="target-card"]').first().click()
        await page.waitForSelector('[data-testid="draft-workspace"]', { timeout: 10000 })

        // 7. Assert: The subject and body should match what we saved
        const displayedSubject = await page.locator('[data-testid="draft-subject"]').textContent()
        const displayedBody = await page.locator('[data-testid="draft-body"]').textContent()

        expect(displayedSubject).toBe(testSubject)
        expect(displayedBody).toContain('This is a test of the hydration persistence')
    })

    test('Draft cache survives target switching', async ({ page }) => {
        // Navigate to Morning Briefing (root route)
        await page.goto('/')
        await page.waitForSelector('[data-testid="queue-sidebar"]', { timeout: 30000 })

        // Get all target cards
        const targetCards = page.locator('[data-testid="target-card"]')
        const cardCount = await targetCards.count()

        // Skip test if less than 2 targets
        if (cardCount < 2) {
            test.skip(true, 'Need at least 2 targets to test switching')
            return
        }

        // Select first target and edit
        await targetCards.first().click()
        await page.waitForSelector('[data-testid="draft-workspace"]', { timeout: 10000 })
        await page.click('[data-testid="edit-button"]')

        const testSubject = `Cache Test ${Date.now()}`
        await page.locator('[data-testid="subject-input"]').fill(testSubject)
        await page.click('[data-testid="save-button"]')
        await page.waitForTimeout(1000)

        // Switch to second target
        await targetCards.nth(1).click()
        await page.waitForTimeout(500)

        // Switch back to first target
        await targetCards.first().click()
        await page.waitForTimeout(500)

        // Assert: First target's edited subject should still be there
        const displayedSubject = await page.locator('[data-testid="draft-subject"]').textContent()
        expect(displayedSubject).toBe(testSubject)
    })
})
