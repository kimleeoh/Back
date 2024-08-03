import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import express from 'express';

const router = express.Router();

router.post('/login', async (req, res) => {
    const sessionId = uuidv4();
    const userData = { /* your user data */ };

    // Store session data in Redis with a 1-hour expiration
    await client.set(sessionId, JSON.stringify(userData), 'EX', 3600);

    // Create JWT with a 1-hour expiration
    const token = jwt.sign({ sessionId }, secretKey, { expiresIn: '1h' });

    // Set JWT in a cookie
    res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 3600000 });
    res.json({ message: 'Logged in successfully' });
});

export default router;