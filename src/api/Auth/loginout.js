import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../../schemas/user.js";
import fs from "fs";
import crypto from "crypto";
import redisHandler from "../../config/redisHandler.js";
import { decipherAES, hashPassword } from "./register.js";
import { timeStamp } from "console";
import { Queue } from "../../utils/recentPageClass.js";
import { CustomBoardView } from "../../schemas/userRelated.js";

//이거는 jwt인증용 rsa키가 될 것.
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

// router.post('/api/login/key', async (req, res) => {
// });

const handleKeyRequest = async (req, res) => {
    try {
        instance = symmetricKeyHolder();
        console.log("Instance initialized:", instance);
        const { symmetricKey, iv } = instance;
        const pub = crypto.createPublicKey(req.body.pub);
        //이 두 정보는 퍼블릭 키로 암호화됨.
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

// router.post('/api/login', async (req, res) => {
// });
const handleLogin = async (req, res) => {
    console.log("Instance during login:", instance);
    const { symmetricKey, iv } = instance;
    const { username, password } = req.body;
    console.log(username, password);
    const decipheredPassword = decipherAES(password, symmetricKey, iv);
    console.log(decipheredPassword);
    const redisClient = redisHandler.getRedisClient();
    const idempotencyKey = req.headers["idempotency-key"];
    const unixTimestamp = Math.floor(Date.now() / 1000);

    if (!instance) {
        return res.status(400).json({
            message: "Key not initialized. Please request a key first.",
        });
    }

    if (!idempotencyKey) {
        return res.status(400).json({ message: "Idempotency key is required" });
    }

    const isDuplicate = await redisClient.hGet("idempotency", idempotencyKey);

    if (unixTimestamp - isDuplicate < 3) {
        return res.status(409).json({ message: "Duplicate request" });
    } else {
        await redisClient.hDel("idempotency", idempotencyKey);
    }
    await redisClient.hSet("idempotency", idempotencyKey, unixTimestamp);

    try {
        const user = await User.findOne({ email: username }).lean();

        if (user == null) {
            return res
                .status(401)
                .json({ message: "아이디 또는 비밀번호가 일치하지 않습니다." });
        }
        if (user.confirmed == 0) {
            return res.status(401).json({
                message:
                    "승인 요청이 관리자에 의해 반려되었습니다. 다시 가입해주세요.",
            });
        } else if (user.confirmed == 1) {
            return res.status(401).json({ message: "승인 대기중인 유저입니다." });
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
        const sensitiveSessionID = crypto.randomBytes(16);
        console.log("세션아이디:", sessionId);
        console.log(sensitiveSessionID.toString("hex"));
        const sessionId_E = crypto
            .privateEncrypt(privateKey, Buffer.from(sessionId))
            .toString("base64");
        const sensitiveSessionID_E = crypto
            .privateEncrypt(privateKey, Buffer.from(sensitiveSessionID))
            .toString("base64");

        // 유저의 MongoDB _id도 추가하여 나중에 조회 가능하도록 함
        const userData = {
            // id: user._id,
            name: user.name,
            profile: user.profile_img,
        };
        const payload = {
            sessionId: sessionId_E,
            sensitiveSessionID: sensitiveSessionID_E,
            userData,
        };

        const {_id, ...selectedBoard} = await CustomBoardView.findOne({ _id: user.Rcustom_brd }).lean();
        console.log(selectedBoard);
        const cache = {
            ...user,
            ...selectedBoard
        }

        req.session.recentDocs = new Queue();

        req.session.save();

        console.log(req.session.recentDocs);
        // Store session data in Redis with a 1-hour expiration
        await redisClient.set(sessionId, JSON.stringify(cache), "EX", 3600);
        await redisClient.sAdd(
            "refreshToken",
            sensitiveSessionID.toString("hex")
        );
        // Create JWT with a 1-hour expiration
        const token = jwt.sign(payload, privateKey, {
            expiresIn: "1h",
            algorithm: "RS256",
        });
        // Set JWT in a cookie
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

// router.delete('/api/logout', async (req, res) => {
// });

const handleLogout = async (req, res) => {
    try {
        const redisClient = redisHandler.getRedisClient();

        await redisClient.del(req.decryptedSessionId);
        await redisClient.sRem("refreshToken", req.body.decryptedSensitiveId);

        delete req.decryptedSessionId, req.decryptedUserData;

        req.session.destroy();

        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export { handleKeyRequest, handleLogin, handleLogout };
