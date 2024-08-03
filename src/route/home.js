import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
    if(req.session.user){
        res.render('admin.ejs', {user : req.session.user});
    }else{
        res.render('home.ejs');
    }
});

export default router;