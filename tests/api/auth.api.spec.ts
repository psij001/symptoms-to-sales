import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

test.describe('Authentication API', () => {
  test('POST /api/auth/login - success with valid credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(process.env.TEST_USER_EMAIL || 'test@example.com');
  });

  test('POST /api/auth/login - missing email', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        password: 'TestPassword123!',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('POST /api/auth/login - missing password', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('POST /api/auth/login - invalid credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('POST /api/auth/signup - success with new user', async ({ request }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    const response = await request.post(`${BASE_URL}/api/auth/signup`, {
      data: {
        email: uniqueEmail,
        password: 'NewPassword123!',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/auth/signup - duplicate email', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/signup`, {
      data: {
        email: 'test@example.com', // Existing email
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(response.status()).toBe(409);
  });

  test('POST /api/auth/signup - missing required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/signup`, {
      data: {
        email: 'newuser@example.com',
        // Missing password
      },
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/auth/user - unauthorized without session', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/user`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/logout - should redirect', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/logout`, {
      maxRedirects: 0,
    });

    // Should redirect to home (307 temporary redirect in Next.js)
    expect([302, 307]).toContain(response.status());
  });
});
