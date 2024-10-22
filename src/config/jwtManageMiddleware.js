import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import redisHandler from "./redisHandler.js";
//import {Mutex} from "async-mutex";

const privateKeyPem = fs.readFileSync(
    "./src/config/afkiller_private_key.pem",
    "utf-8"
);
const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: "pem",
    type: "pkcs8",
});

const publicKeyPem = fs.readFileSync(
    "./src/config/afkiller_public_key.pem",
    "utf8"
);
const publicKey = crypto.createPublicKey({
    key: publicKeyPem,
    format: "pem",
    type: "pkcs8",
});

//const mutex = new Mutex();

const logoutMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, publicKey, async (err, decoded) => {
        if (err) {
            console.log(err);
            return res.sendStatus(403);
        }
        const sessionId = decoded.sessionId;
        let sensitiveSessionID = decoded.sensitiveSessionID;
        const sensitiveSessionID_D = crypto
            .publicDecrypt(publicKey, Buffer.from(sensitiveSessionID, "base64"))
            .toString("hex");
        const sessionId_D = crypto
            .publicDecrypt(publicKey, Buffer.from(sessionId, "base64"))
            .toString("utf-8");
        req.decryptedSessionId = sessionId_D;
        req.body.decryptedSensitiveId = sensitiveSessionID_D;});

    next();
};

// const myMiddleware = async (req, res, next) => {
//     const token = req.cookies.token; // 쿠키에서 JWT 토큰을 가져옴
//     if (!token) return res.status(401).send("No token provided");

//     jwt.verify(token, publicKey, async (err, decoded) => {
//         if (err) {
//             console.error("JWT verification error:", err);
//             return res.status(403).send("Invalid token");
//         }

//         const sessionId_D = crypto
//             .publicDecrypt(publicKey, Buffer.from(decoded.sessionId, "base64"))
//             .toString("utf-8");

//         const redisClient = redisHandler.getRedisClient();
//         const sessionExists = await redisClient.exists(sessionId_D);

//         if (!sessionExists) {
//             return res
//                 .status(403)
//                 .send("Invalid session. Please log in again.");
//         }

//         req.decryptedSessionId = sessionId_D; // 세션 ID 설정
//         req.decryptedUserData = decoded.userData; // 유저 데이터 설정

//         next();
//     });
// };
const myMiddleware = async(req, res, next) => {
    
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, publicKey, async (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(403).send("No token provided");
        }
        const sessionId = decoded.sessionId;
        let sensitiveSessionID = decoded.sensitiveSessionID;

        const sensitiveSessionID_D = crypto
            .publicDecrypt(publicKey, Buffer.from(sensitiveSessionID, "base64"))
            .toString("hex");
        const sessionId_D = crypto
            .publicDecrypt(publicKey, Buffer.from(sessionId, "base64"))
            .toString("utf-8");
        console.log(sessionId_D);

        const redisClient = redisHandler.getRedisClient();
        try {
            const sessionExists = await redisClient.exists(sessionId_D);
            console.log(sensitiveSessionID_D);
            let sensitiveSessionExists = await redisClient.sIsMember(
                "refreshToken",
                sensitiveSessionID_D
            );
            if(!sensitiveSessionExists) sensitiveSessionExists = await redisClient.sIsMember(
                "refreshToken",
                sensitiveSessionID_D
            );
  
            console.log(sensitiveSessionExists, sensitiveSessionID_D);
            if (sessionExists != 1 && sensitiveSessionExists == 0)
                return res
                    .status(403)
                    .send("Security Issue, Please Login Again");
            else if (sensitiveSessionExists == 0) {
                await redisClient.del(sessionId_D);
                return res
                    .status(403)
                    .send(
                        "Session Expired due to security issues, Please Login Again"
                    );
            }
            await redisClient.sRem("refreshToken", sensitiveSessionID_D);
            //await redisClient.
        } catch (err) {
            return res.status(403).send(err);
        }

        // Reset the expiration time of the session data in Redis to 1 hour
        await redisClient.expire(sessionId_D, 3600);
        console.log("Session ID:", sessionId_D);
        let newSensitiveSessionID = crypto.randomBytes(16);
        sensitiveSessionID = crypto
            .privateEncrypt(privateKey, newSensitiveSessionID)
            .toString("base64");
        newSensitiveSessionID = newSensitiveSessionID.toString("hex");
        await redisClient.sAdd("refreshToken", newSensitiveSessionID);
        
        const payload = {
            sessionId,
            sensitiveSessionID,
            userData: decoded.userData,
        };
        // Optionally, refresh the JWT and send it back to the client
        const newToken = jwt.sign(payload, privateKey, {
            algorithm: "RS256",
            expiresIn: "1h",
        });
        res.cookie("token", newToken, {
            httpOnly: true,
            secure: true,
            maxAge: 3600000,
        });
        // 유저 캐시정보담겨있는 세션아이디
        req.decryptedSessionId = sessionId_D;
        console.log("Session ID:", req.decryptedSessionId);
        // 자주 쓰는 정보(덜민감한)
        req.decryptedUserData = decoded.userData;

        next();
    });
};

export { myMiddleware, logoutMiddleware};
