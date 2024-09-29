import { AdminLogin } from './adminSchemas.js';
import { ADMIN_AUTH_CODE } from './adminAuthcodeSafer.js';
import redisHandler from '../config/redisHandler.js';

// router.post('/login', async (req, res) => {
// });

const handleAdminLogin = async (req, res) => {
    console.log(req.body);
    const { rawUsername, rawPassword } = req.body;
    const username = String(rawUsername).replace(/[^a-zA-Z0-9*@]/g, '');
    const password = String(rawPassword).replace(/[^a-zA-Z0-9*@]/g, '');
    console.log(username, password);
    AdminLogin.find({_id:"3", Admins:{$elemMatch:{id:username, pw:password}}})
    .then((result)=>{
        if(result.length > 0){
            req.session.user = {
                name: username,
                authCode: ADMIN_AUTH_CODE.get()
            };
            console.log(req.session.user);
            const redisClient = redisHandler.getRedisClient();
            redisClient.sAdd('logged_in_admins', req.session.user.name)
            .then(() => {
                res.redirect(301, '/admin/online');
            })
            .catch((err) => {
                console.log(err);
                if (err) {
                    console.error('Redis error:', err);
                    res.status(500).render("home.ejs", { loginStatus: 'Internal Server Error-Redis' });
                }
            });
        } else {
            res.status(401).render("home.ejs", { loginStatus: 'Unauthorized' });
        }
    })
    .catch((e) => {
        console.error(e);
        res.status(500).render("home.ejs", { loginStatus: 'Internal Server Error' });
    });
}

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
        res.status(200).json({ time: ttl, session: req.session });
    } else {
        res.status(404).send('No active session');
    }
}

export { handleAdminLogin, handleAdminLogout, handleAdminSessionTimeLeft };