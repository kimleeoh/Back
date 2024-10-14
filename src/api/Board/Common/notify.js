import mainInquiry from "../../../functions/mainInquiry";
import { Notify } from "../../../schemas/notify";

const handleNotify = async (req, res) => {  
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const r = await mainInquiry.read(['Rnotify_list', 'notify_type_list'], req.decryptedSessionId);
    const notifyList = await Notify.find({ _id: { $in: r.Rnotify_list } }).lean();
    res.status(200).json({ notifyList });}
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export { handleNotify };


    