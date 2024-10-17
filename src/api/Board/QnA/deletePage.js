import redisHandler from "../../../config/redisHandler.js";
import s3Handler from "../../../config/s3Handler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { Category, LowestCategory } from "../../../schemas/category.js";
import { QnaDocuments } from "../../../schemas/docs.js";
import { UserDocs } from "../../../schemas/userRelated.js";


const handleDeleteQna = async (req, res) => {
    try {
        const { doc_id } = req.params; // 게시글의 doc_id

        // Redis에서 사용자 정보 조회
        if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(
            ["_id", "POINT", "Rdoc"],
            req.decryptedSessionId
        );

        const img = await QnaDocuments.findByIdAndDelete(doc_id);
        await s3Handler.delete(img.img_list);

        const udoc = await UserDocs.findById(received.Rdoc);
        udoc.Rqna_list = udoc.Rqna_list.filter((item) => item !== doc_id);
        await udoc.save();

        const cat = await LowestCategory.findById(req.session.currentDocs.category_id);
        cat.Rqna_list = cat.Rqna_list.filter((item) => item !== doc_id);
        await cat.save();
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export { handleDeleteQna };