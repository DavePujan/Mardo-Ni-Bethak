const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const redisClient = require('../config/redis');

// Mock Supabase to avoid real DB network calls
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
            }),
            insert: jest.fn().mockResolvedValue({ error: null })
        })
    })
}));

describe("Auth API", () => {
    it("should login a valid user via local provider", async () => {
        const hashedPassword = await bcrypt.hash("password123", 10);
        User.findOne = jest.fn().mockResolvedValue({
            id: 1,
            email: "test@test.com",
            password: hashedPassword,
            role: "student",
            provider: "local"
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: "test@test.com", password: "password123" });

        expect(res.statusCode).toEqual(200);
        expect(res.body.role).toBe("student");
        expect(Array.isArray(res.headers['set-cookie'])).toBe(true);
    });

    it("should fail login with incorrect password", async () => {
        const hashedPassword = await bcrypt.hash("password123", 10);
        User.findOne = jest.fn().mockResolvedValue({
            id: 1,
            email: "test@test.com",
            password: hashedPassword,
            role: "student"
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ email: "test@test.com", password: "wrongpassword" });

        expect(res.statusCode).toEqual(401);
    });

    afterAll(async () => {
        try {
            redisClient.disconnect();
        } catch (e) {
            // Ignore teardown errors in tests.
        }
    });
});
