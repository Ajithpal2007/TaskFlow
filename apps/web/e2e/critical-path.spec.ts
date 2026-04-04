// apps/web/e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';

test('Critical Path: User can sign up and access the dashboard', async ({ page }) => {
  // 1. Go to your local Next.js frontend
  await page.goto('http://localhost:3000');

  // 2. Verify the landing page loaded
  await expect(page.getByText('TaskFlow', { exact: true })).toBeVisible();

  // 3. Fill out the hero email and click to sign up
  await page.getByPlaceholder('work@company.com').fill('hello@taskflow.com');
  await page.getByRole('button', { name: 'Get Early Access' }).first().click();

  // 4. Verify we are on the signup page
  await expect(page).toHaveURL(/.*sign-up/);

  // 5. Fill out the Better Auth signup form
   const testEmail = `testuser_${Date.now()}@example.com`; 
   
   // Using getByLabel matches the accessible "Name", "Email", and "Password" textboxes
   await page.getByLabel('Name').fill('Test');
   await page.getByLabel('Email').fill(testEmail);
   await page.getByLabel('Password').fill('SecurePassword123!');
   
   // 6. Submit the form (Updated to match the actual button text)
   await page.getByRole('button', { name: 'Create an account' }).click();

  // 7. Complete the onboarding process by provisioning a workspace
   await page.getByRole('button', { name: 'Build My Workspace' }).click();

   // 8. THE CRITICAL ASSERTION: Did we make it to the Dashboard?
   await page.waitForURL('**/dashboard');
   
   // Increase the expect timeout to 15s to account for the loading screen
   await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
});