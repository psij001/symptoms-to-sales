import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

test.describe('Projects API', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    // Login to get session cookie
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      },
    });

    const headers = loginResponse.headers();
    authCookie = headers['set-cookie'] || '';
  });

  test('GET /api/projects - unauthorized without session', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/projects`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/projects - authorized with session', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/projects`, {
      headers: { Cookie: authCookie },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/projects - create project', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/projects`, {
      headers: { Cookie: authCookie },
      data: {
        name: `API Test Project ${Date.now()}`,
        type: 'personal',
        description: 'Created via API test',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.name).toContain('API Test Project');
    expect(body.type).toBe('personal');
  });

  test('POST /api/projects - unauthorized without session', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/projects`, {
      data: {
        name: 'Test Project',
        type: 'personal',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('POST /api/projects - missing required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/projects`, {
      headers: { Cookie: authCookie },
      data: {
        description: 'Missing name and type',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /api/projects - invalid type', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/projects`, {
      headers: { Cookie: authCookie },
      data: {
        name: 'Test Project',
        type: 'invalid_type',
      },
    });

    expect(response.status()).toBe(400);
  });
});
