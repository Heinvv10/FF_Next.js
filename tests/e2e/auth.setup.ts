import { test as setup } from '@playwright/test';

/**
 * Mock Authentication Setup for E2E Tests
 * Bypasses Clerk authentication by setting mock session data
 */

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('/');

  // Mock Clerk session by setting localStorage and cookies
  await page.evaluate(() => {
    // Mock Clerk session in localStorage
    const mockClerkSession = {
      id: 'test-session-id',
      userId: 'test-user-id',
      status: 'active',
      lastActiveAt: Date.now(),
      expireAt: Date.now() + 86400000, // 24 hours
    };

    const mockUser = {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [
        {
          emailAddress: 'test@fibreflow.test',
          id: 'test-email-id',
        },
      ],
      primaryEmailAddressId: 'test-email-id',
    };

    // Store mock data in localStorage (Clerk uses __clerk prefix)
    localStorage.setItem('__clerk_db_jwt', JSON.stringify({
      jwt: 'mock-jwt-token',
    }));

    localStorage.setItem('__clerk_client', JSON.stringify({
      sessions: [mockClerkSession],
      activeSessionId: mockClerkSession.id,
      signInAttempt: null,
      signUpAttempt: null,
    }));

    localStorage.setItem('__clerk_user', JSON.stringify(mockUser));
  });

  // Set a mock authentication cookie
  await page.context().addCookies([
    {
      name: '__session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
