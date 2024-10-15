import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";


const handlePointRead = async (req, res) => {
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    console.log('decryptedSessionId:', req.decryptedSessionId);
    let r = await mainInquiry.read(['POINT'], req.decryptedSessionId);
    if(!r){
        r = await mainInquiry.read(['POINT'], req.decryptedSessionId);
    }
    res.status(200).json({point:r.POINT});
}catch(e){
    console.error(e);
    res.status(500).send("Internal Server Error");
}
}
export { handlePointRead };

