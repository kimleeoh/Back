import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";
import { UserDocs } from "../../schemas/userRelated.js";
import { HoneyDocuments, PilgyDocuments, TestDocuments } from "../../schemas/docs.js";

const handlePurchased = async(req,res) =>{
    const decryptedSessionId = String(req.decryptedSessionId);
    const { filters, depth } = req.query; // filters 값 받기

    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 유저 정보 가져오기
        const userInfo = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );
        if (!userInfo || !userInfo._id || !userInfo.Rdoc) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // UserDocs에서 유저의 Rqna_list, Rpilgy_list, Rhoney_list, Rtest_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc }).select('Rpurchased_list').lean();
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "User documents not found" });
        }
        const end = -12 * (depth - 1) || undefined;
        const start = end - 12;
        const renderDocs = userDocs.Rpurchased_list.slice(start, end);

        const a = await PilgyDocuments.find({_id : {$in : renderDocs}}).lean();
        const b = await HoneyDocuments.find({_id : {$in : renderDocs}}).lean();
        const c = await TestDocuments.find({_id : {$in : renderDocs}}).lean();

        let result = [...a,...b,...c];
        result.sort((prev, after)=> after.time-prev.time);

        console.log("P result", result);

        res.status(200).send({pList:result});

    }catch(error){
        console.error("Error fetch like list:", error);
        res.status(500).json({ message: "Failed to retrieve like list" });
    }

}

export { handlePurchased };