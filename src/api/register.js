import express from 'express';
import {User} from '../schemas/user.js';
import crypto from 'crypto';
import redisHandler from '../config/redisHandler.js';
import smtpTransport from '../config/emailHandler.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs';

//이거는 jwt인증용 rsa키가 될 것.
const privateKeyPem = fs.readFileSync('./src/config/afkiller_private_key.pem', 'utf-8');
const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
    type: 'pkcs8'
});

//이거는 로그인 전 데이터 암호화용 대칭키가 될 것.
const symmetricKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16); // 초기화 벡터(IV) 생성
console.log(symmetricKey, iv);
const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);


function decipherAES(target){
    const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, iv);
    let decryptedResult = decipher.update(target, 'base64', 'utf8');
    decryptedResult += decipher.final('utf8');

    return decryptedResult;
}

/*
프론트에 넘겨야 하는 코드

클라이언트측 비대칭 암호키 생성
const { generateKeyPairSync } = require('crypto');
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

암호화된 비밀번호를 서버로 전송하는 코드
const publicKey = // Get this from your backend or pre-distributed;
const encoded = new TextEncoder().encode(password);
const encryptedPassword = await crypto.subtle.encrypt(
  {
    name: "RSA-OAEP"
  },
  publicKey,
  encoded
);
 */
//const decryptedPassword = crypto.privateDecrypt(privateKey, encryptedPassword);

const router = express.Router();

router.get("/publickey", (req, res) => {
    const publicKey = readFileSync('../config/afkiller_public_key.pem', 'utf8');
    res.json({ publicKey });
});

async function hashPassword(password) {
    const saltRounds = 10; // The cost factor for generating the salt
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

router.post("/register/page/:page", async function (req, res) {
    const redisClient = redisHandler.getRedisClient();
    const nowpage = parseInt(req.params.page);
    if (nowpage == 1) {
        //이름 입력
        //{name : "이름", pub : "암호화된 client공개키"}
        //이로서 client<->server 대칭키로 암호화된 정보 주고받음.
        const newDocId = crypto.randomBytes(16).toString('hex');
        console.log("새게시아이디",newDocId);
        const pub = crypto.createPublicKey(req.body.pub);
        //이 두 정보는 퍼블릭 키로 암호화됨.
        const encryptedData = crypto.publicEncrypt(pub, newDocId);
        const encryptedIV = crypto.publicEncrypt(pub, iv);
        const encryptedSymmetricKey = crypto.publicEncrypt(pub, symmetricKey);
        try{
            await redisClient.hSet(newDocId, 'name',req.body.name, 'EX', 3600);
            res.status(200).send({message : "Session created", id : encryptedData, iv : encryptedIV, key : encryptedSymmetricKey});
        }catch(err){
            res.status(500).send(`Internal Server Error-redis: ${err}`); 
        }
    }
    else if (nowpage == 2) {
        //학부 입력
        //{id : "암호화된 id", hakbu : "학부"}
        console.log(req.body.id);   
        const decryptedRedisID = decipherAES(req.body.id);
        console.log(decryptedRedisID);
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
        const decryptedRedisID = decipherAES(req.body.id);
        console.log(decryptedRedisID);
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
        const decryptedRedisID = decipherAES(req.body.id);
        const decryptedData2 = decipherAES(req.body.email);

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
        const decryptedRedisID = decipherAES(req.body.id);
        const decryptedData2 = decipherAES(req.body.bibun);
        console.log("전달은 받았다");
        const hashedPassword = await hashPassword(decryptedData2);
        const mySavedData = await redisClient.hGetAll(decryptedRedisID);
        console.log(mySavedData);
        

        const final = new User({
            _id: new mongoose.Types.ObjectId(),
            confirmed: 1,
            name: mySavedData.name,
            POINT: 0,
            Rbadge_list: [],
            Rcustom_brd: new mongoose.Types.ObjectId(),
            Rdoc: new mongoose.Types.ObjectId(),
            Rnotify: new mongoose.Types.ObjectId(),
            Rscore: new mongoose.Types.ObjectId(),
            badge_img: "",
            email: mySavedData.email,
            exp: 0,
            hakbu: mySavedData.hakbu,
            hakbun: mySavedData.hakbun,
            level: 0,
            password: hashedPassword,
            picked: 0,
            profile_img: ""
        });
        try{
        await final.save();}
        catch(err){
            res.status(500).send(`Internal Server Error-mongoose: ${err}`);
        }
    }
});

var generateRandomNumber = function (min, max) {
    var randNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return randNum;
};

router.post('/register/email', async (req,res)=>{
    //{email : 입력이메일값}
    const number = generateRandomNumber(11111, 99999);
    console.log(req.body.email);

    const mailOptions = {
        from: EMAIL_USER,
        to: req.body.email,
        subject: " [A-F Killer] 이메일 확인 인증번호 안내",
        html: `<h1>아래 인증번호를 확인하여 이메일 인증을 완료해 주세요.</h1><br></br><b>${number}</b>`
    };

    try{
        await smtpTransport.sendMail(mailOptions);
        await redisClient.hSet(req.body.email, 'authNum', number,'EX', 3600);
        smtpTransport.close();
        res.status(200).send({message : "mail sent"});
    }
    catch(err){
        res.status(500).send(err);
        smtpTransport.close();
    }
    
});

router.post('/register/emailAuthNum', async (req,res)=>{
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

export default router;
