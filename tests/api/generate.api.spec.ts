import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// Skip AI generation tests if Claude API isn't configured
// These tests require actual API calls and may be slow
const skipAITests = process.env.SKIP_AI_TESTS === 'true' || process.env.MOCK_AI === 'true';

test.describe('Generate API Endpoints', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      },
    });

    const headers = loginResponse.headers();
    authCookie = headers['set-cookie'] || '';
  });

  test.describe('Triangle Endpoints', () => {
    test('POST /api/generate/triangle/symptoms - unauthorized', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/generate/triangle/symptoms`, {
        data: {
          audience: 'Test audience',
          problem: 'Test problem',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /api/generate/triangle/symptoms - missing fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/generate/triangle/symptoms`, {
        headers: { Cookie: authCookie },
        data: {
          audience: 'Test audience',
          // Missing problem
        },
      });

      expect(response.status()).toBe(400);
    });

    test('POST /api/generate/triangle/symptoms - success', async ({ request }) => {
      test.skip(skipAITests, 'Skipping AI test - MOCK_AI is enabled');
      test.slow();

      const response = await request.post(`${BASE_URL}/api/generate/triangle/symptoms`, {
        headers: { Cookie: authCookie },
        data: {
          audience: 'Small business owners',
          problem: 'Getting clients',
        },
      });

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/plain');

      const body = await response.text();
      expect(body.length).toBeGreaterThan(0);
      // Should contain numbered list
      expect(body).toMatch(/\d+\./);
    });

    test('POST /api/generate/triangle/wisdom - with selected symptom', async ({ request }) => {
      test.skip(skipAITests, 'Skipping AI test - MOCK_AI is enabled');
      test.slow();

      const response = await request.post(`${BASE_URL}/api/generate/triangle/wisdom`, {
        headers: { Cookie: authCookie },
        data: {
          audience: 'Small business owners',
          problem: 'Getting clients',
          selectedSymptom: 'Staring at an empty inbox',
        },
      });

      expect(response.status()).toBe(200);
    });

    test('POST /api/generate/triangle/metaphor - with all context', async ({ request }) => {
      test.skip(skipAITests, 'Skipping AI test - MOCK_AI is enabled');
      test.slow();

      const response = await request.post(`${BASE_URL}/api/generate/triangle/metaphor`, {
        headers: { Cookie: authCookie },
        data: {
          audience: 'Small business owners',
          problem: 'Getting clients',
          selectedSymptom: 'Staring at an empty inbox',
          selectedWisdom: 'The best clients are hiding in plain sight',
        },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('T1 Email Endpoint', () => {
    test('POST /api/generate/t1-email - unauthorized', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/generate/t1-email`, {
        data: {
          emailType: 'rsvp',
          audience: 'Test',
          problem: 'Test',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /api/generate/t1-email - missing fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/generate/t1-email`, {
        headers: { Cookie: authCookie },
        data: {
          emailType: 'rsvp',
          // Missing audience and problem
        },
      });

      expect(response.status()).toBe(400);
    });

    test('POST /api/generate/t1-email - success', async ({ request }) => {
      test.skip(skipAITests, 'Skipping AI test - MOCK_AI is enabled');
      test.slow();

      const response = await request.post(`${BASE_URL}/api/generate/t1-email`, {
        headers: { Cookie: authCookie },
        data: {
          emailType: 'rsvp',
          audience: 'Marketing agencies',
          problem: 'Client retention',
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body.length).toBeGreaterThan(0);
    });
  });

  test.describe('Subject Lines Endpoint', () => {
    test('POST /api/generate/subject-lines - unauthorized', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/generate/subject-lines`, {
        data: {
          audience: 'Test',
          problem: 'Test',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('POST /api/generate/subject-lines - from audience', async ({ request }) => {
      test.skip(skipAITests, 'Skipping AI test - MOCK_AI is enabled');
      test.slow();

      const response = await request.post(`${BASE_URL}/api/generate/subject-lines`, {
        headers: { Cookie: authCookie },
        data: {
          audience: 'SaaS founders',
          problem: 'High churn',
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body.length).toBeGreaterThan(0);
    });

    test('POST /api/generate/subject-lines - from T1 email', async ({ request }) => {
      test.skip(skipAITests, 'Skipping AI test - MOCK_AI is enabled');
      test.slow();

      const response = await request.post(`${BASE_URL}/api/generate/subject-lines`, {
        headers: { Cookie: authCookie },
        data: {
          t1Email: 'Subject: The hidden cost\n\nHey there, have you noticed...',
        },
      });

      expect(response.status()).toBe(200);
    });
  });
});

test.describe('Voice DNA API', () => {
  test('POST /api/voice-dna/parse - no file', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/voice-dna/parse`);
    expect(response.status()).toBe(400);
  });

  test('POST /api/voice-dna/parse - invalid file type', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/voice-dna/parse`, {
      multipart: {
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake image'),
        },
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/PDF|DOCX|support/i);
  });
});
