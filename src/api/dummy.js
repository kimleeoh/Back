import express from 'express';
import mongoose from 'mongoose';
import { QnaDocuments, HoneyDocuments,QnaAnswers,QnaAlready } from '../schemas/docs.js';
import { User } from '../schemas/user.js';

const router = express.Router();

router.get('/dummy/testqna', async (req, res) => {
    try{
        const result = await QnaAlready.findOne();
        console.log(result);    
        const answerData = await QnaAnswers.findById(result.answer_list[0].Ranswer,{_id:0,Rqna:0}).lean();
        const answerUserData = await User.findById(result.answer_list[0].Ruser, {level:1, hakbu:1, name:1,_id:0}).lean();
        
        const fin = {
            ...answerData, 
            ...answerUserData, 
            user_grade:result.answer_list[0].user_grade
        };

        result.answer_list = [fin];
        console.log(fin);
        res.status(200).json(result);
    }
    catch(e){
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dummy/testtips', async (req, res) => {
    HoneyDocuments.findOne()
    .then((result)=>{
        res.status(200).json(result);
    })
    .catch((e)=>{
        console.error(e);
        res.status(500).send('Internal Server Error');
    });
    
});

export default router;