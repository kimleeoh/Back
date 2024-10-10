import {User} from '../../schemas/user.js';
import crypto from 'crypto';
import redisHandler from '../../config/redisHandler.js';
import smtpTransport from '../../config/emailHandler.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import axios from 'axios';
import fs from 'fs';
import { CustomBoardView, Score, UserDocs } from '../../schemas/userRelated.js';
import { AdminConfirm } from '../../admin/adminSchemas.js';
import s3Handler from '../../config/s3Handler.js';

class symmetricDataQueue {
    #items;
    #times;

    constructor() {
        this.#items = new Map();
        this.#times = [];
    }

    // Add an element to the end of the queue
    // 30분 이상된 데이터는 삭제
    async enqueue(element,iv,id){
        this.#times.push([Date.now(), id]);
        const data = [element,iv];
        this.#items.set(id,data);
        if(this.#times[0][0] < Date.now()-1800000){
            this.#items.remove(this.#times[0][1]);
            this.#times.shift();
        }
        return;
    }

    searchByKey(key){
        const index = this.#items.has(key);
        if(index == false){
            return -1;
        }
        console.log(this.#items.get(key));
        return this.#items.get(key);
    }

    deleteByKey(key){
        const index = this.#items.has(key);
        if(index == false){
            return -1;
        }
        this.#items.delete(key);
        return 1;
    }

    // Remove an element from the front of the queue
    // dequeue() {
    //     if (this.isEmpty()) {
    //         return "Queue is empty";
    //     }
    //     return this.items.shift();
    // }

    // // Check if the queue is empty
    // isEmpty() {
    //     return this.items.length === 0;
    // }

    // // Get the front element of the queue
    // front() {
    //     if (this.isEmpty()) {
    //         return "Queue is empty";
    //     }
    //     return this.items[0];
    // }

    // // Get the size of the queue
    // size() {
    //     return this.items.length;
    // }

}


const symmetricKeyHolder = new symmetricDataQueue();


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

var generateRandomNumber = function (min, max) {
    var randNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return randNum;
};

// registerRoute.post("/register/page/:page", async function (req, res) {
    
// });

const handleRegister=async(req,res)=>{
    const redisClient = redisHandler.getRedisClient();
    const nowpage = parseInt(req.params.page);
    
    if (nowpage == 1) {
        //이름 입력
        //{name : "이름", pub : "암호화된 client공개키"}
        //이로서 client<->server 대칭키로 암호화된 정보 주고받음.
        //이거는 로그인 전 데이터 암호화용 대칭키가 될 것.
        const symmetricKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16); // 초기화 벡터(IV) 생성
        const newDocId = crypto.randomBytes(16).toString('hex');
        
        const pub = crypto.createPublicKey(req.body.pub);

        const imsi = cipherAES(newDocId, symmetricKey, iv).toString();
        //이 두 정보는 퍼블릭 키로 암호화됨.
        const encryptedData = crypto.publicEncrypt(pub, newDocId);
        const encryptedIV = crypto.publicEncrypt(pub, iv);
        const encryptedSymmetricKey = crypto.publicEncrypt(pub, symmetricKey);
        
        const savedKey = symmetricKey.toString('base64');
        const savedIV = iv.toString('base64');
        await symmetricKeyHolder.enqueue(savedKey, savedIV,imsi);
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
        
        const resultList = symmetricKeyHolder.searchByKey(req.body.id);
        const symmetricKey = Buffer.from(resultList[0], 'base64');
        const iv = Buffer.from(resultList[1], 'base64');
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
        const isAlready = await User.findOne({hakbun:req.body.hakbun});
        if(isAlready){
            res.status(201).send({message : "Hakbun already exists"});
            return;
        }
        const resultList = symmetricKeyHolder.searchByKey(req.body.id);
        const symmetricKey = Buffer.from(resultList[0], 'base64');
        const iv = Buffer.from(resultList[1], 'base64');
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
        const resultList = symmetricKeyHolder.searchByKey(req.body.id);
        const symmetricKey = Buffer.from(resultList[0], 'base64');
        const iv = Buffer.from(resultList[1], 'base64');
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
        const resultList = symmetricKeyHolder.searchByKey(req.body.id);
        const symmetricKey = Buffer.from(resultList[0], 'base64');
        const iv = Buffer.from(resultList[1], 'base64');
        const decryptedRedisID = decipherAES(req.body.id, symmetricKey, iv);
        const decryptedData2 = decipherAES(req.body.bibun, symmetricKey, iv);
        
        const hashedPassword = await hashPassword(decryptedData2);
        try{
            await redisClient.hSet(decryptedRedisID, 'password', hashedPassword);
            res.status(200).send({message : "Pass added"});
        }catch(err){
            res.status(500).send(`Internal Server Error-redis: ${err}`);
        }
    }else if (nowpage == 6) {
        //{id : "암호화된 id", imgLink : "암호화된 인증이미지 링크"}
        console.log(req.body);
        const resultList = symmetricKeyHolder.searchByKey(req.body.id);
        const symmetricKey = Buffer.from(resultList[0], 'base64');
        const iv = Buffer.from(resultList[1], 'base64');
        const decryptedRedisID = decipherAES(req.body.id, symmetricKey, iv);
        const decryptedData2 = decipherAES(req.body.imgLink, symmetricKey, iv);

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
            notify_list: [],
            notify_type: [],
            Rscore: score,
            badge_img: "",
            email: mySavedData.email,
            exp: 0,
            hakbu: mySavedData.hakbu,
            hakbun: mySavedData.hakbun,
            level: 0,
            password: mySavedData.password,
            picked: 0,
            intro: "",
            profile_img: ""
        });

        try{
            await final.save();
            const n = new Date().toLocaleString('ko-KR');
            //"https://afkiller-img-db.s3.ap-northeast-2.amazonaws.com/test.png"
            await AdminConfirm.updateOne({_id:0}, {$push : {unconfirmed_list : {Ruser:final._id, confirm_img:decryptedData2, time:n}}});//나중에 이미지 추가
            await AdminConfirm.updateOne({_id:2}, {$inc : {all_user_sum : 1}});
            console.log("new user created");

        }
        catch(err){
            res.status(500).send(`Internal Server Error-mongoose: ${err}`);
        }
        
        //axios.get('http://localhost:4502/admin/online/newData');
        
        res.status(200).send({message : "User created and broadcasted to admin"});
    }
}

// registerRoute.post('/register/email', async (req,res)=>{
//     //{email : 입력이메일값}
// });

const handleCheckAlreadyEmail=async(req,res)=>{
    const isAlready = await User.findOne({email:req.body.email});
    if(isAlready){
        res.status(201).send({message : "Email already exists"});
    }else{
        res.status(200).send({message : "Email not exists"});
    }
}

const handleEmailAuthSend=async(req,res)=>{
    console.log(req.body.email);
    const redisClient = redisHandler.getRedisClient();
    const number = generateRandomNumber(11111, 99999);
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
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
}

// registerRoute.post('/register/emailAuthNum', async (req,res)=>{
//     //{email : 입력이메일값, authNum : 입력인증번호}
// });

const handleEmailAuthCheck=async(req,res)=>{
    const redisClient = redisHandler.getRedisClient();
    try{
        const result = await redisClient.hGet(req.body.email, 'authNum');
        if(result == req.body.authNum){
            await redisClient.del(req.body.email);
            res.status(200).send({message : "auth success"});
        }else{
            res.status(201).send({message : "auth failed"});
        }
    }
    catch(err){
        res.status(500).send(err);
    }
}

// registerRoute.post('/register/imgUpload', async (req,res)=>{
//     //{id : "암호화된 id", img : "이미지"}
// });

const handleConfirmImgUpload=async(req,res)=>{
    try{
        const fileStream = fs.createReadStream(req.file.path);
        const link = await s3Handler.put('confirm', fileStream);
        fs.unlinkSync(req.file.path);
        console.log(link);
        res.status(200).send({message : "img uploaded", link : link});}
        catch(err){
            res.status(500).send(err);
        }
}

const handleFindPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
      if (!user) {
          return res.status(201).json({ message: "User not found" });
      }
      const number = generateRandomNumber(11111, 99999);
      const redisClient = redisHandler.getRedisClient();
      
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: req.body.email,
          subject: " [A-F Killer] 비밀번호 재설정 요청 인증.",
          html: `<h1>아래 인증번호를 확인하여 10분 내로 이메일 인증을 완료해 주세요.</h1><br></br><b>${number}</b>`
      };
  
      try{
          await smtpTransport.sendMail(mailOptions);
          await redisClient.hSet(email, 'authNum', number);
          await redisClient.expire(email, 600);
          smtpTransport.close();
          res.status(200).send({message : "mail sent"});
      }
      catch(err){
          res.status(500).send(err);
          smtpTransport.close();
      }
  }
  
  const handleAuthFindPassword = async (req, res) => {
      const { email, authNum } = req.body;
      const redisClient = redisHandler.getRedisClient();
      const number = await redisClient.hGet(email, 'authNum');
      if(number !== authNum){
          return res.status(401).json({ message: "Invalid authentication number" });
      }
      return res.status(200).send({message: "Authentication success"});
  }
  
  const handleResetPassword = async (req, res) => {
    //const salt = crypto.randomBytes(16);
    const { email, newPassword, iv } = req.body;
    const redisClient = redisHandler.getRedisClient();
    try{
    const number = await redisClient.hGet(email, 'authNum');
    
    const key = crypto.pbkdf2Sync(email, iv, 1000, 32, 'sha256');
    const ib = crypto.pbkdf2Sync(number, iv, 1000, 16, 'sha256');
    
    const decipheredPassword = decipherAES(newPassword, key, ib);
  
    const hashedPassword = await hashPassword(decipheredPassword);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await redisClient.del(email);
    res.status(200).send({message : "Password changed"});
    }catch(err){
        res.status(500).send(err);
    }
  }

export {
    decipherAES, cipherAES, hashPassword, //보안 관련
    handleRegister, handleConfirmImgUpload, handleEmailAuthSend, handleEmailAuthCheck,handleCheckAlreadyEmail,  //라우터 관련
    handleFindPassword, handleAuthFindPassword, handleResetPassword //비밀번호 찾기 관련
};
