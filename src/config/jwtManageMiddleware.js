import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import redisHandler from "./redisHandler";

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
  "../config/afkiller_public_key.pem",
  "utf8"
);
const publicKey = crypto.createPublicKey(publicKeyPem);

const myMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, publicKey, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    const sessionId = decoded.sessionId;
    let sensitiveSessionID = decoded.sensitiveSessionID;
    const sensitiveSessionID_D = crypto
      .publicDecrypt(publicKey, Buffer.from(sensitiveSessionID, "base64"))
      .toString("utf8");
    const sessionId_D = crypto
      .publicDecrypt(publicKey, Buffer.from(sessionId, "base64"))
      .toString("hex");
    const redisClient = redisHandler.getRedisClient();
    try {
      const sessionExists = await redisClient.exists(sessionId_D);
      const sensitiveSessionExists = await redisClient.sIsMember(
        "refreshToken",
        sensitiveSessionID_D
      );

      if (!sessionExists && !sensitiveSessionExists) return res.sendStatus(403);
      else if (!sensitiveSessionExists) {
        await redisClient.sRem(sessionId_D);
        return res
          .status(403)
          .send("Session Expired due to security issues, Please Login Again");
      }
      await redisClient.sRem(sensitiveSessionID_D);
      //await redisClient.
    } catch (err) {
      return res.sendStatus(403);
    }

    // Reset the expiration time of the session data in Redis to 1 hour
    await redisClient.expire(sessionId_D, 3600);
    const newSensitiveSessionID = crypto.randomBytes(16);
    sensitiveSessionID = crypto
      .publicEncrypt(publicKey, newSensitiveSessionID)
      .toString("base64");
    const payload = {
      sessionId,
      sensitiveSessionID,
      userData: decoded.userData,
    };
    // Optionally, refresh the JWT and send it back to the client
    const newToken = jwt.sign(payload, privateKey, { expiresIn: "1h" });
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
    });
    res.status(200).json({
      message: "Token refreshed",
      decryptedSessionId: sessionId_D,
      decryptedUserData: decoded.userData,
    });

    next();
  });
};

export default myMiddleware;
