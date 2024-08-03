import express from 'express';
import { AdminLogin } from '../schemas/admin.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    AdminLogin.find({_id:"3", Admins:{$elemMatch:{id:username, pw:password}}})
    .then((result)=>{
        if(result.length > 0){
            req.session.isAdmin = true;
            res.status(200).send('Logged in successfully');
        }else{
            res.status(401).send('Unauthorized');
        }
    })
    .catch((e)=>{
        console.error(e);
        res.status(500).send('Internal Server Error');
    });
    
});

export default router;