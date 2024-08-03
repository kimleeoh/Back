import express from 'express';
import mongoose from 'mongoose';
import { QnaDocuments, HoneyDocuments } from '../schemas/docs.js';

const router = express.Router();

router.get('/qna', async (req, res) => {
    QnaDocuments.findOne()
    .then((result)=>{
        res.status(200).json(result);
        console.log(result);
    })
    .catch((e)=>{
        console.error(e);
        res.status(500).send('Internal Server Error');
    });
});

router.get('/tips', async (req, res) => {
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