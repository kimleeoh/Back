import express from 'express';
import {User} from '../schemas/user.js';
import crypto from 'crypto';
import redisHandler from '../config/redisHandler.js';
import smtpTransport from '../config/emailHandler.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import axios from 'axios';
import fs from 'fs';
import { CustomBoardView, Score, UserDocs } from '../schemas/userRelated.js';
import { AdminConfirm } from '../admin/adminSchemas.js';


//이거는 로그인 전 데이터 암호화용 대칭키가 될 것.
const symmetricKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16); // 초기화 벡터(IV) 생성
const registerRoute = express.Router();


function decipherAES(target, symmetricKey, iv){
    const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, iv);
    let decryptedResult = decipher.update(target, 'base64', 'utf8');
    decryptedResult += decipher.final('utf8');

    return decryptedResult;
}

function cipherAES(target, symmetricKey, iv){
    const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);
    let encryptedResult = cipher.update(target, 'utf8', 'base64');
    encryptedResult += cipher.final('base64');

    return encryptedResult;
}


async function hashPassword(password) {
    const saltRounds = 10; // The cost factor for generating the salt
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

registerRoute.post("/register/page/:page", async function (req, res) {
    const redisClient = redisHandler.getRedisClient();
    const nowpage = parseInt(req.params.page);
    if (nowpage == 1) {
        //이름 입력
        //{name : "이름", pub : "암호화된 client공개키"}
        //이로서 client<->server 대칭키로 암호화된 정보 주고받음.
        const newDocId = crypto.randomBytes(16).toString('hex');
        
        const pub = crypto.createPublicKey(req.body.pub);
        //이 두 정보는 퍼블릭 키로 암호화됨.
        const encryptedData = crypto.publicEncrypt(pub, newDocId);
        const encryptedIV = crypto.publicEncrypt(pub, iv);
        const encryptedSymmetricKey = crypto.publicEncrypt(pub, symmetricKey);
        try{
            await redisClient.hSet(newDocId, 'name',req.body.name);
            await redisClient.expire(newDocId, 3600);
            res.status(200).send({message : "Session created", id : encryptedData, iv : encryptedIV, key : encryptedSymmetricKey});
        }catch(err){
            res.status(500).send(`Internal Server Error-redis: ${err}`); 
        }
    }
    else if (nowpage == 2) {
        //학부 입력
        //{id : "암호화된 id", hakbu : "학부"}

        const decryptedRedisID = decipherAES(req.body.id, symmetricKey, iv);
        try{
            await redisClient.hSet(decryptedRedisID, 'hakbu', req.body.hakbu);
            res.status(200).send({message : "Hakbu added"});    
        }catch(err){
            res.status(500).send(`Internal Server Error-redis: ${err}`);
        }   
    }
    else if (nowpage == 3) {
        //학번 입력
        //{id : "암호화된 id", hakbun : "학번"}
        const decryptedRedisID = decipherAES(req.body.id, symmetricKey, iv);
        try{
            await redisClient.hSet(decryptedRedisID, 'hakbun',req.body.hakbun);
            res.status(200).send({message : "Hakbun added"});
        }catch(err){
            res.status(500).send(`Internal Server Error-redis: ${err}`);
        }
    }
    else if (nowpage == 4) {
        //이메일 입력
        //{id : "암호화된 id", email : "암호화된 이메일"}
        const decryptedRedisID = decipherAES(req.body.id, symmetricKey, iv);
        const decryptedData2 = decipherAES(req.body.email, symmetricKey, iv);

        try{
            await redisClient.hSet(decryptedRedisID, 'email', decryptedData2);
            res.status(200).send({message : "Email added"});
        }catch(err){
            res.status(500).send(`Internal Server Error-redis: ${err}`);
        }
    }
    else if (nowpage == 5) {
        //비밀번호 입력
        //{id : "암호화된 id", bibun : "암호화된 비밀번호"}
        const decryptedRedisID = decipherAES(req.body.id, symmetricKey, iv);
        const decryptedData2 = decipherAES(req.body.bibun, symmetricKey, iv);
        
        const hashedPassword = await hashPassword(decryptedData2);
        const mySavedData = await redisClient.hGetAll(decryptedRedisID);
        await redisClient.del(decryptedRedisID);

        const custom = new mongoose.Types.ObjectId();
        const doc = new mongoose.Types.ObjectId();
        const score = new mongoose.Types.ObjectId();

        const final = new User({
            _id: new mongoose.Types.ObjectId(),
            confirmed: 1,
            name: mySavedData.name,
            POINT: 0,
            Rbadge_list: [],
            Rcustom_brd: custom,
            Rdoc: doc,
            Rnotify_list: [],
            Rscore: score,
            badge_img: "",
            email: mySavedData.email,
            exp: 0,
            hakbu: mySavedData.hakbu,
            hakbun: mySavedData.hakbun,
            level: 0,
            password: hashedPassword,
            picked: 0,
            intro: "",
            profile_img: ""
        });

        const myCustom = new CustomBoardView({
            _id: custom,
            Renrolled_list: [],
            Rbookmark_list: [],
            Rlistened_list: [],
        });

        const myDoc = new UserDocs({
            _id: doc,
            Rpilgy_list: [],
            Rhoney_list: [],
            Rtest_list: [],
            Rqna_list:[],
            Rreply_list: [],
            RmyLike: {
                Rqna_list: [],
                Rpilgy_list: [],
                Rhoney_list: [],
                Rtest_list: []
            },
            RmyScrap_list: {
                Rqna_list: [],
                Rpilgy_list: [],
                Rhoney_list:[],
                Rtest_list: []
            },
            Rnotify_list: [],
            final_views: 0,
            final_scraped: 0,
            final_liked: 0,
            last_up_time: new Date()    
        });

        const myScore = new Score({
            _id: score,
            Ruser: final._id,
            is_show: false,
            overA_subject_list: [],
            overA_type_list: [],
            semester_list: {
                subject_list: [],
                credit_list: [],
                grade_list: [],
                ismajor_list: []
            }
        
        });


        try{
            await final.save();
            await myCustom.save();
            await myDoc.save();
            await myScore.save();
            await AdminConfirm.updateOne({_id:0}, {$inc : {unconfirmed_list : {Ruser:final._id, confirm_img:"https://afkiller-img-db.s3.ap-northeast-2.amazonaws.com/test.png"}}});//나중에 이미지 추가
            await AdminConfirm.updateOne({_id:2}, {$inc : {all_user_sum : 1}});
            console.log("new user created");
            const result = await axios.put(`http://localhost:4502/admin/online/newData`);
            if(result.status == 200){
                res.status(200).send({message : "User created and broadcasted to admin"});
            }else{
                res.status(200).send({message : "only user created"});
            }

        }
        catch(err){
            res.status(500).send(`Internal Server Error-mongoose: ${err}`);
        }
    }
});

var generateRandomNumber = function (min, max) {
    var randNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return randNum;
};

registerRoute.post('/register/email', async (req,res)=>{
    //{email : 입력이메일값}
    const number = generateRandomNumber(11111, 99999);
    console.log(req.body.email);

    const mailOptions = {
        from: EMAIL_USER,
        to: req.body.email,
        subject: " [A-F Killer] 이메일 확인 인증번호 안내",
        html: `<h1>아래 인증번호를 확인하여 5분 내로 이메일 인증을 완료해 주세요.</h1><br></br><b>${number}</b>`
    };

    try{
        await smtpTransport.sendMail(mailOptions);
        await redisClient.hSet(req.body.email, 'authNum', number);
        await redisClient.expire(req.body.email, 300);
        smtpTransport.close();
        res.status(200).send({message : "mail sent"});
    }
    catch(err){
        res.status(500).send(err);
        smtpTransport.close();
    }
    
});

registerRoute.post('/register/emailAuthNum', async (req,res)=>{
    //{email : 입력이메일값, authNum : 입력인증번호}
    try{
        const result = await redisClient.hGet(req.body.email, 'authNum');
        if(result == req.body.authNum){
            res.status(200).send({message : "auth success"});
        }else{
            res.status(401).send({message : "auth failed"});
        }
    }
    catch(err){
        res.status(500).send(err);
    }
});

export {registerRoute, decipherAES, cipherAES, hashPassword};
