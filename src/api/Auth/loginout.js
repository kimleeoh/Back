import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../../schemas/user.js";
import fs from "fs";
import crypto from "crypto";
import redisHandler from "../../config/redisHandler.js";
import { decipherAES } from "./register.js";

// JWT 인증용 RSA 키 생성
const privateKeyPem = fs.readFileSync(
  "./src/config/afkiller_private_key.pem",
  "utf-8"
);
const privateKey = crypto.createPrivateKey({
  key: privateKeyPem,
  format: "pem",
  type: "pkcs8",
});

const symmetricKeyHolder = () => {
  //이거는 데이터 암호화용 대칭키가 될 것.
  const symmetricKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16); // 초기화 벡터(IV) 생성

  return { symmetricKey, iv };
};

//symmetricKey, iv를 세션에 저장해야함.
let instance = null;

// 로그인 키 요청 처리
export const handleKeyRequest = async (req, res) => {
  try {
    instance = symmetricKeyHolder();
    const { symmetricKey, iv } = instance;
    const pub = crypto.createPublicKey(req.body.pub);
    const encryptedIV = crypto.publicEncrypt(pub, iv);
    const encryptedSymmetricKey = crypto.publicEncrypt(pub, symmetricKey);
    res.status(200).send({
      message: "Success",
      iv: encryptedIV,
      key: encryptedSymmetricKey,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 로그인 처리
export const handleLogin = async (req, res) => {
  const { symmetricKey, iv } = instance;
  const { username, password } = req.body;
  const decipheredPassword = decipherAES(password, symmetricKey, iv);
  const redisClient = redisHandler.getRedisClient();
  const idempotencyKey = req.headers["idempotency-key"];
  const unixTimestamp = Math.floor(Date.now() / 1000);

  if (!idempotencyKey) {
    return res.status(400).json({ message: "Idempotency key is required" });
  }

  const isDuplicate = await redisClient.hGet("idempotency", idempotencyKey);

  if (unixTimestamp - isDuplicate < 60) {
    return res.status(409).json({ message: "Duplicate request" });
  } else {
    await redisClient.hDel("idempotency", idempotencyKey);
  }
  await redisClient.hSet("idempotency", idempotencyKey, unixTimestamp);

  try {
    const user = await User.findOne({ email: username });

    if (!user) {
      return res
        .status(401)
        .json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }
    if (user.confirmed === 0) {
      return res.status(401).json({
        message: "승인 요청이 관리자에 의해 반려되었습니다. 다시 가입해주세요.",
      });
    }
    if (user.confirmed === 1) {
      return res.status(401).json({ message: "승인 대기중입니다." });
    }

    const hashedPassword = user.password;
    const isValidPassword = await bcrypt.compare(
      decipheredPassword,
      hashedPassword
    );

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
    }

    const sessionId = uuidv4();
    const sensitiveSessionID = crypto.randomBytes(16).toString("hex");

    const sessionId_E = crypto
      .privateEncrypt(privateKey, Buffer.from(sessionId))
      .toString("base64");
    const sensitiveSessionID_E = crypto
      .privateEncrypt(privateKey, Buffer.from(sensitiveSessionID))
      .toString("base64");

    const userData = { name: user.name, profile: user.profile_img };
    const payload = {
      sessionId: sessionId_E,
      sensitiveSessionID: sensitiveSessionID_E,
      userData,
    };

    await redisClient.set(sessionId, JSON.stringify(user.toJSON()), "EX", 3600);
    await redisClient.set("refreshToken", sensitiveSessionID);

    const token = jwt.sign(payload, privateKey, {
      expiresIn: "1h",
      algorithm: "RS256",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
    });
    await redisClient.hDel("idempotency", idempotencyKey);
    res.status(200).json({ message: "Logged in successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 로그아웃 처리
export const handleLogout = async (req, res) => {
  try {
    const redisClient = redisHandler.getRedisClient();
    const token = req.cookies.token;
    const sessionId = jwt.decode(token).sessionId;
    const sensitiveSessionId = jwt.decode(token).sensitiveSessionID;
    await redisClient.del(sessionId);
    await redisClient.sRem("refreshToken", sensitiveSessionId);
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
