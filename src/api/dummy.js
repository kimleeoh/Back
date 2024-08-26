import express from 'express';
import mongoose from 'mongoose';
import { QnaDocuments, HoneyDocuments,QnaAnswers } from '../schemas/docs.js';
import { User } from '../schemas/user.js';

const router = express.Router();

router.get('/dummy/qna', async (req, res) => {
    try{
        const result = await QnaDocuments.findOne();
        const answerData = await QnaAnswers.findById(result.answer_list[0].Ranswer,{_id:0,Rqna:0});
        const answerUserData = await User.findById(result.answer_list[0].Ruser, {level:1, hakbu:1, name:1});
        result.answer_list=[{...answerData._doc, ...answerUserData._doc, user_grade:result.answer_list[0].user_grade}];
        res.status(200).json(result);
    }
    catch(e){
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dummy/tips', async (req, res) => {
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