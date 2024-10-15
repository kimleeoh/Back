import mainInquiry from "../../../functions/mainInquiry.js";
import { Notify } from "../../../schemas/notify.js";
import redisHandler from "../../../config/redisHandler.js";

const handleNotify = async (req, res) => {
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const r = await mainInquiry.read(['Rnotify_list'], req.decryptedSessionId);
    console.log(r);
    const notifyList = await Notify.find({ _id: { $in: r.Rnotify_list } });
    console.log(notifyList);
    res.status(200).json({ notifyList });}
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleNotifyCheck = async (req, res) => {
    try{
    const notifyList = await Notify.findByIdAndUpdate(req.body.notificationId, {checked:true});
    res.status(200).send("complete");}
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleNewNotify = async (req, res) => {
    //{send:true}로 요청 시 새로운 알림이 없음을 알림
    try{
        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        if(req.body.send){
            const r = await mainInquiry.write({'newNotify':false}, req.decryptedSessionId);
            res.status(200).send({newNotify:false});
        }
        else{
            const r = await mainInquiry.read(['newNotify'], req.decryptedSessionId);
            res.status(200).send({newNotify:r.newNotify});
        }
    }
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export { handleNotify, handleNotifyCheck, handleNewNotify };