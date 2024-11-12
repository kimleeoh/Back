import { AdminLogin } from './adminSchemas.js';
import { ADMIN_AUTH_CODE } from './adminAuthcodeSafer.js';
import redisHandler from '../config/redisHandler.js';

// router.post('/login', async (req, res) => {
// });

const handleAdminLogin = async (req, res) => {
    console.log("Received login request:", req.body); // 로그인 요청 로그

    const { rawUsername, rawPassword } = req.body;
    const username = String(rawUsername).replace(/[^a-zA-Z0-9*@]/g, "");
    const password = String(rawPassword).replace(/[^a-zA-Z0-9*@]/g, "");

    console.log("Sanitized Username:", username); // 사용자 이름 확인
    console.log("Sanitized Password:", password); // 비밀번호 확인

    const redisClient = redisHandler.getRedisClient();
    if (!redisClient) {
        console.error("Failed to connect to Redis."); // Redis 연결 실패 로그
        return res
            .status(500)
            .render("home.ejs", { loginStatus: "Internal Server Error-Redis" });
    }

    try {
        const result = await AdminLogin.find({
            _id: "3",
            Admins: { $elemMatch: { id: username, pw: password } },
        });

        console.log("Database query result:", result); // 데이터베이스 조회 결과 확인

        if (result.length > 0) {
            req.session.user = {
                name: username,
                authCode: ADMIN_AUTH_CODE.get(),
            };
            await req.session.save();
            console.log("Session saved for user:", req.session.user);

            await redisClient.sAdd("logged_in_admins", username);
            console.log("Added to Redis logged_in_admins set:", username); // Redis에 추가 확인

            res.redirect(301, "/admin/online");
        } else {
            console.log("No matching user found, Unauthorized");
            res.status(401).render("home.ejs", { loginStatus: "Unauthorized" });
        }
    } catch (e) {
        console.error("Error during login process:", e); // 오류 로그
        res.status(500).render("home.ejs", {
            loginStatus: "Internal Server Error",
        });
    }
};2
// router.post('/logout', async (req, res) => {
// });

const handleAdminLogout = async (req, res) => {
    if(req.session.user){
        const redisClient = redisHandler.getRedisClient();
        console.log(req.session.user.name);
        await redisClient.sRem('logged_in_admins', req.session.user.name)
        .then(() => {
            req.session.destroy((err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                }
                console.log("destroyed");
                res.redirect(301, '/');
            });
        })
        .catch((err) => {
            console.error('Redis error:', err);
            res.status(500).send('Internal Server Error-Redis');
        });
    } else {
        res.redirect(301, '/');
    }
}

// router.get('/session-time-left', (req, res) => {
// });

const handleAdminSessionTimeLeft = async (req, res) => {    
    if (req.session) {
        const ttl = req.session.cookie.maxAge - (Date.now() - req.session.cookie._expires.getTime());
        req.session.user.authCode = req.body.authCode;
        await req.session.save();
        res.status(200).json({ time: ttl});
    } else {
        res.status(404).send('No active session');
    }
}

export { handleAdminLogin, handleAdminLogout, handleAdminSessionTimeLeft };