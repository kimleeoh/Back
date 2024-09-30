import mongoose from 'mongoose';
import { QnaDocuments, HoneyDocuments,QnaAnswers,QnaAlready } from '../../../schemas/docs.js';
import { User } from '../../../schemas/user.js';
import mainInquiry from '../../../functions/mainInquiry.js';
import redisHandler from '../../../config/redisHandler.js';
import s3Handler from '../../../config/s3Handler.js';
import { UserDocs } from '../../../schemas/userRelated.js';

//decryptedSessionId: sessionId_D, 이건 해독된 세션아이디
//decryptedUserData: decoded.userData -> 이건 이름이랑 프로필 사진만 가지고 있음
// router.post('/qna/create/post', myMiddleware, async (req, res) => {
//     //프론트측에서 보낼 데이터 : title, content, images, now_category_list, limit, point, time
// });

const handleQnACreate = async(req, res)=>{
    try{
        const data = new QnaDocuments();
        if(mainInquiry.isNotRedis){
            const a=redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(a);
        }
    
        const received = await mainInquiry.read(['_id','hakbu','POINT','Rdoc'], req.body.decryptedSessionId);
        console.log(received);
        const linkList = [];
        for (const a in req.body.images){
            linkList.push(await s3Handler.put(a,'/Q'));
        }
        const objId = new mongoose.Types.ObjectId();
        const nc = req.body.board.map((a)=>a['value']);
        data._id = objId;
        data.title = req.body.title;
        data.content = req.body.content;
        data.img_list = linkList;
        data.now_category_list = nc;
        data.time = req.body.time;
        data.views = 0;
        data.likes = 0;
        data.scrap = 0;
        data.warn = 0;
        data.Ruser = received._id;
        data.user_main = `${received.hakbu} ${req.body.decryptedUserData.name}`;
        data.user_img = req.body.decryptedUserData.profile_img;
        data.preview_content = req.body.content.slice(0,100);
        data.picked_index = 0;
        data.answer_list = [];  
        data.restricted_type = req.body.limit;
        if(data.restricted_type==true){
            const p = restricted_type.POINT - req.body.point;
            await mainInquiry.write({'POINT':p},req.body.decryptedSessionId);
        }
        delete req.body.decryptedSessionId;
        delete req.body.decryptedUserData;
        console.log(data);
        await data.save();
        const i = new mongoose.Types.ObjectId(received.Rdoc);
        const lastCheck = await UserDocs.findOneAndUpdate({_id:i},{$inc:{written:1}, $push:{Rqna_list:objId}},{new:true});
        console.log(lastCheck);
        res.status(200).json({message:'Success'});
        
    }catch(e){
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
}

export { handleQnACreate };
