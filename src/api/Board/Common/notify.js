import mainInquiry from "../../../functions/mainInquiry.js";
import { Notify } from "../../../schemas/notify.js";
import redisHandler from "../../../config/redisHandler.js";
import { User } from "../../../schemas/user.js";

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
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const notifyList = await Notify.findByIdAndUpdate(req.body.notificationId, {checked:true}, {new:true});
    const updates = {};

    if (notifyList.point !== 0) {
        updates.POINT = notifyList.point;
    }

    if (notifyList.types == 12) {
        updates.picked = 1;
    }

    if (Object.keys(updates).length > 0) {
        await mainInquiry.write(updates, req.decryptedSessionId);
    }
    res.status(200).send("complete");}
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleNewNotify = async (req, res) => {
    try{
        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const r = await mainInquiry.read(['_id'], req.decryptedSessionId);
        const current = await User.findById(r._id).newNotify;
        await mainInquiry.write({newNotify:current}, req.decryptedSessionId);
        res.status(200).send({newNotify:current});
    }
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleUnNewNotify = async (req, res) => {
    try{
        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const r = await mainInquiry.write({newNotify:false}, req.decryptedSessionId);
        res.status(200).send("done");
    }
    catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export { handleNotify, handleNotifyCheck, handleNewNotify, handleUnNewNotify };