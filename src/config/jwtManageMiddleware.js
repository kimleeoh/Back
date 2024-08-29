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
        let sensitiveSessionID = decoded.sensitiveSessionID;
        const sensitiveSessionID_D = crypto.publicDecrypt(publicKey, Buffer.from(sensitiveSessionID, 'base64'));
        const sessionId_D = crypto.publicDecrypt(publicKey, Buffer.from(sessionId, 'base64'));
        const redisClient = redisHandler.getRedisClient();
        try{
        await redisClient.exists(sessionId_D);
        await redisClient.exists(sensitiveSessionID_D);
        //await redisClient.
        }catch(err){
        return res.sendStatus(403);
        }

        // Reset the expiration time of the session data in Redis to 1 hour
        await redisClient.expire(sessionId_D, 3600);
        const payload = { sessionId, sensitiveSessionID, userData:decoded.userData };
        // Optionally, refresh the JWT and send it back to the client
        const newToken = jwt.sign(payload, privateKey, { expiresIn: '1h' });
        res.cookie('token', newToken, { httpOnly: true, secure: true, maxAge: 3600000 });
        res.status(200).json({
            message: "Token refreshed",
            decryptedSessionId: sessionId_D,
        });

        next();
});
}

export default myMiddleware;