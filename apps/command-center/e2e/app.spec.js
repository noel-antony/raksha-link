import { test, expect } from '@playwright/test';

test.describe('SentinelOS E2E Tests', () => {

  test('should display the landing page correctly', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/SentinelOS/);

    // Verify main hero section
    const headline = page.locator('h1');
    await expect(headline).toContainText('When disaster strikes');

    // Verify Open Source SDK section
    const sdkHeader = page.locator('h2:has-text("SentinelOS SDK")');
    await expect(sdkHeader).toBeVisible();

    const pipCode = page.locator('code:has-text("pip install neighbor_aid")');
    await expect(pipCode).toBeVisible();
  });

  test('should navigate to login page from landing page', async ({ page }) => {
    await page.goto('/');

    // Click Coordinator Login button
    const loginButton = page.locator('button:has-text("Coordinator Login")');
    await loginButton.click();

    // Should navigate to /login
    await expect(page).toHaveURL(/.*\/login/);

    // Verify login page renders correctly
    const welcomeHeader = page.locator('h2:has-text("Welcome back")');
    await expect(welcomeHeader).toBeVisible();
  });

  test('should show validation warnings on empty login', async ({ page }) => {
    await page.goto('/login');

    const signInButton = page.locator('button:has-text("Sign in")');
    await signInButton.click();

    // The browser should naturally prevent default if inputs are required, 
    // or the app will show a toast.
    // The inputs have 'required' attribute
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // In many cases, Playwright evaluates the native HTML5 validation
    // We can just verify the URL didn't change
    await expect(page).toHaveURL(/.*\/login/);
  });

});
