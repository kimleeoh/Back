import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";
import { Modal } from "../../schemas/notify.js";

const handleModal = async(req,res)=>{
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const r = await mainInquiry.read(['Rmodal_noti_list'], req.decryptedSessionId);
    if(!r){
        r = await mainInquiry.read(['Rmodal_noti_list'], req.decryptedSessionId);
    }
    const result = await Modal.find({_id : {$in:r.Rmodal_noti_list}});
    const totalAddPoint = result.reduce((acc,cur)=>acc+=cur.point,0);
    const totalHTMLfy = result.map((cur)=>`<p>${cur.types}</p><br><p>${cur.reward}</p>`);
    await Modal.deleteMany({_id : {$in:r.Rmodal_noti_list}});
    await mainInquiry.write({'-Rmodal_noti_list':r.Rmodal_noti_list, 'POINT':totalAddPoint}, req.decryptedSessionId);

    res.status(200).send(totalHTMLfy);}
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export {handleModal};