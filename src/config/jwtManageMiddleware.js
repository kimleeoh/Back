import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import redisHandler from "./redisHandler.js";

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

// // 새로운 JWT 미들웨어 - 유저 ID를 추출하여 req.user에 저장
// const jwtExtractUserMiddleware = (req, res, next) => {
//     const token = req.cookies.token;
//     if (!token) return res.sendStatus(401);  // JWT 토큰이 없을 때

//     jwt.verify(token, publicKey, (err, decoded) => {
//         if (err) {
//             console.log("JWT verification error:", err);
//             return res.sendStatus(403); // JWT 검증 실패
//         }

//         // JWT에서 유저 정보를 추출하여 req.user에 저장
//         console.log("Decoded JWT:", decoded); // 해독된 JWT 정보 로그
//         req.user = decoded.userData;

//         next();
//     });
// };

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
        req.body.decryptedSessionId = sessionId_D;
        req.body.decryptedSensitiveId = sensitiveSessionID_D;});

    next();
};

const myMiddleware = (req, res, next) => {
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
        const redisClient = redisHandler.getRedisClient();
        try {
            const sessionExists = await redisClient.exists(sessionId_D);

            const sensitiveSessionExists = await redisClient.sIsMember(
                "refreshToken",
                sensitiveSessionID_D
            );

            if (sessionExists != 1 && sensitiveSessionExists == false)
                return res
                    .status(403)
                    .send("Security Issue, Please Login Again");
            else if (sensitiveSessionExists == false) {
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
            return res.sendStatus(403);
        }

        // Reset the expiration time of the session data in Redis to 1 hour
        await redisClient.expire(sessionId_D, 3600);
        const newSensitiveSessionID = crypto.randomBytes(16);
        sensitiveSessionID = crypto
            .privateEncrypt(privateKey, newSensitiveSessionID)
            .toString("base64");
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
        req.body.decryptedSessionId = sessionId_D;
        // 자주 쓰는 정보(덜민감한)
        req.body.decryptedUserData = decoded.userData;

        next();
    });
};

export { myMiddleware, logoutMiddleware};
