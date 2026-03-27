import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.ts';

describe('App', () => {
    it('GET /health returns 200 with status ok', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
    });
});
