import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 10, // Virtual users
    duration: '10s', // Test duration
};

export default function () {
    const host = __ENV.API_HOST || 'localhost';
    const url = `http://${host}:5000/auth/login`;

    const payload = JSON.stringify({
        email: 'test@example.com',
        password: '123456'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    // Track successful logically rate-limited requests vs crashes
    check(res, {
        'is status 200 or 429': (r) => r.status === 200 || r.status === 429,
        'rate limit trigger': (r) => r.status === 429,
        'fallback header present': (r) => r.headers['X-Fallback-Mode'] === 'memory'
    });

    sleep(0.1);
}
