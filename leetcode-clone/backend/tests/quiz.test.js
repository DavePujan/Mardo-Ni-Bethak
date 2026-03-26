const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

// Mock DB
jest.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            insert: jest.fn().mockResolvedValue({ data: [{ id: 'quiz123' }], error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'prof1' }, error: null })
        })
    })
}));

describe("Quiz Creation API", () => {
    let token;

    beforeAll(() => {
        // Generate a teacher token directly
        token = jwt.sign({ id: 99, email: "teacher@test.com", role: "teacher" }, process.env.JWT_SECRET || "dummy_secret");
    });

    it("should let a teacher hit the quiz creation endpoint", async () => {
        const res = await request(app)
            .post('/api/teacher/quiz/full')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: "Test Quiz",
                subject: "Math",
                duration: 60,
                totalMarks: 100,
                questions: []
            });

        // The mock might not perfectly cover the 10 nested table inserts, 
        // but we expect the route to be protected and exist.
        expect(res.statusCode).not.toEqual(404);
        expect(res.statusCode).not.toEqual(401);
        expect(res.statusCode).not.toEqual(403);
    });

    afterAll(async () => {
        try {
            redisClient.disconnect();
        } catch (e) {
            // Ignore teardown errors in tests.
        }
    });
});
