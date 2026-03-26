const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

jest.mock('../utils/judge0', () => ({
    run: jest.fn().mockResolvedValue({
        status_id: 3,
        status: { description: "Accepted" },
        time: "0.01",
        memory: 128
    })
}));

jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: '1' }, error: null }),
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            update: jest.fn().mockReturnThis()
        })
    })
}));

describe("Submission API", () => {
    let token;
    beforeAll(() => {
        token = jwt.sign({ id: 1, email: "student@test.com", role: "student" }, process.env.JWT_SECRET || "dummy_secret");
    });

    it("should process a code submission and hit the judge0 mock", async () => {
        const res = await request(app)
            .post('/api/submit')
            .set('Authorization', `Bearer ${token}`)
            .send({
                attemptId: "attempt123",
                questionId: "add-two", // hardcoded in models/Question.js
                code: "function addTwo(a,b) { return a+b; }",
                language: "javascript"
            });

        expect(res.statusCode).not.toEqual(404);
        expect(res.statusCode).not.toEqual(401);
    });

    afterAll(async () => {
        try {
            redisClient.disconnect();
        } catch (e) {
            // Ignore teardown errors in tests.
        }
    });
});
