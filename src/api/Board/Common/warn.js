import { AdminWarn } from "../../../admin/adminSchemas.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { HoneyDocuments, PilgyDocuments, QnaAnswers, QnaDocuments, TestDocuments } from "../../../schemas/docs.js";

//{filters:'', warn_why: boolean[]}
const handleWarn = async(req, res) => {    
    console.log(req.body.id);
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    
    const updateDocument = async (Document) => {
        const r = await Document.findById(req.body.id);
        r.warn += 1;
        for(let i = 0; i < 8; i++) {
            if(req.body.warn_why[i]) {
                r.warn_why_list[i] += 1;
            }
        }
        await r.save();
        
        if(r.warn >= 10){
            const check = await mainInquiry.read(['warned'], req.decryptedSessionId);
            if(check.warned > 8) {
                await mainInquiry.write({confirmed:1}, req.decryptedSessionId);
            }
            await AdminWarn.create({Rdoc:req.body.id, count:r.warn, why_list:r.warn_why_list, type:req.body.filters});
        }
        
        return r;
    };

    let result;
    switch(req.body.filters){
        case "qna":
            result = await updateDocument(QnaDocuments);
            break;
        case "answer":
            result = await updateDocument(QnaAnswers);
            break;
        case "pilgy":
            result = await updateDocument(PilgyDocuments);
            break;
        case "honey":
            result = await updateDocument(HoneyDocuments);
            break;
        case "test":
            result = await updateDocument(TestDocuments);
            break;
        default:
            return res.status(400).json({ success: false, message: "Invalid filter" });
    }

    res.status(200).send({ message:"Success" });
}

export { handleWarn };