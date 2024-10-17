import { QnaAnswers, QnaDocuments } from "../../../schemas/docs.js";
import { UserDocs } from "../../../schemas/userRelated.js";
import s3Handler from "../../../config/s3Handler.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { notify } from "../../../functions/notifier.js";
import fs from "fs";
import mongoose from "mongoose";


const handleQnaAnswer = async (req, res) => {
    try {
        const { id, answer } = req.body;

        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(['Rdoc', '_id'],req.decryptedSessionId);

        const qna = await QnaDocuments.findById(id);
        const userDoc = await UserDocs.findById(received.Rdoc);

        const linkList = [];
        if(req.files!==undefined){
        
        console.log(req.files);
        for (const a of req.files){
            const fileStream = fs.createReadStream(a.path);
            const imgLink = await s3Handler.put('A', fileStream)
            linkList.push(imgLink);
            fs.unlinkSync(a.path)
        }}

        const answerId = new mongoose.Types.ObjectId();
        await QnaAnswers.create({
            _id: answerId,
            content: answer,
            img_list: linkList,
            warn_why_list: [0,0,0,0,0,0,0,0],
            QNAcategory: qna.now_category_list,
            likes: 0,
            warn: 0,
            Rqna: id
        });
        qna.answer_list.push(answerId);
        await qna.save();

        let modal = rewardNullCheck(1, userDoc, {})
        userDoc.written+=1;
        await userDoc.save();
        if(!modal.status){
            modal = rewardOtherCheck(3, userDoc, {});
        }
        // if(modal.status){
        //     await notify.Self(received._id, qna._id, qna.title, req.decryptedUserData.name, 3);
        // }
        await notify.Author(qna.Ruser, qna._id, qna.title, req.decryptedUserData.name, 2);
        await notify.Follower(qna.Rnotifyusers_list, qna._id, qna.title, req.decryptedUserData.name, 10);

        res.status(200).send("OK");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleEditAnswer = async (req, res) => {
    try {
        const { answerId, answer, removeImg } = req.body;
        const qna = await QnaAnswers.findById(answerId);
        if (!qna) {
            res.status(404).send("Qnaanswer not found");
            return;
        }

        if(req.files!==undefined){
            const linkList = [];
            console.log(req.files);
            for (const a of req.files){
                const fileStream = fs.createReadStream(a.path);
                const imgLink = await s3Handler.put('A', fileStream)
                linkList.push(imgLink);
                fs.unlinkSync(a.path)
            }
            qna.img_list = qna.img_list.filter(img => !removeImg.includes(img));
            qna.img_list.push(...linkList);
        }
        await s3Handler.delete(removeImg);
        

        qna.content = answer;
        await qna.save();
        res.status(200).send("OK");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleDeleteAnswer = async (req, res) => {
    try {
        const { answerId } = req.body;

        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(['Rdoc', '_id'],req.decryptedSessionId);

        const qna = await QnaDocuments.findById(id);
        const userDoc = await UserDocs.findById(received.Rdoc);

        userDoc.written-=1;
        if(userDoc.written%10>0) {
            alert("쓰신 답변이 이전 보상 기준을 못채워 보상이 회수되었습니다.ㅠㅠ");
            await mainInquiry.write({POINT: -50}, req.decryptedSessionId);
        }

        qna.answer_list = qna.answer_list.filter(answer => answer.Ranswer !== answerId);

        await userDoc.save();
        await qna.save();

        await s3Handler.delete(qna.img_list);

        await QnaAnswers.findByIdAndDelete(answerId);
        res.status(200).send("OK");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export { handleQnaAnswer, handleEditAnswer, handleDeleteAnswer };