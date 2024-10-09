import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";


const handlePointRead = async (req, res) => {
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const r = await mainInquiry.read(['POINT'], req.body.decryptedSessionId);
    res.status(200).json({point:r.POINT});
}

export { handlePointRead };

