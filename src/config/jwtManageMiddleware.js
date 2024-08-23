import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';
import redisHandler from './redisHandler';

const privateKeyPem = fs.readFileSync('./src/config/afkiller_private_key.pem', 'utf-8');
const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
    type: 'pkcs8'
});

const publicKeyPem = fs.readFileSync('../config/afkiller_public_key.pem', 'utf8');
const publicKey = crypto.createPublicKey(publicKeyPem);

const myMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, publicKey, async (err, decoded) => {
        if (err) return res.sendStatus(403);

        const sessionId = decoded.sessionId;
        const redisClient = redisHandler.getRedisClient();
        const sessionData = await redisClient.exists(sessionId);
        if (!sessionData) return res.sendStatus(403);

        // Reset the expiration time of the session data in Redis to 1 hour
        await redisClient.expire(sessionId, 3600);
        const payload = { sessionId, userData:decoded.userData };
        // Optionally, refresh the JWT and send it back to the client
        const newToken = jwt.sign(payload, privateKey, { expiresIn: '1h' });
        res.cookie('token', newToken, { httpOnly: true, secure: true, maxAge: 3600000 });

        next();
});
}

export default myMiddleware;