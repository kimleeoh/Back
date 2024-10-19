import redisHandler from "../../../config/redisHandler.js";
import s3Handler from "../../../config/s3Handler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { Category, LowestCategory } from "../../../schemas/category.js";
import { QnaDocuments } from "../../../schemas/docs.js";
import { UserDocs } from "../../../schemas/userRelated.js";

const handleDeleteTips = async (req, res) => {
    try {
        const { doc_id } = req.params; // 게시글의 doc_id

        // Redis에서 사용자 정보 조회
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(
            ["_id", "POINT", "Rdoc"],
            req.decryptedSessionId
        );

        // UserDocs에서 해당 문서 삭제
        const userdoc = await UserDocs.findById(received.Rdoc);

        // Rpilgy_list, Rhoney_list, Rtest_list 중 doc_id가 있는 리스트에서 삭제
        userdoc.Rpilgy_list = userdoc.Rpilgy_list.filter(
            (item) => item !== doc_id
        );
        userdoc.Rhoney_list = userdoc.Rhoney_list.filter(
            (item) => item !== doc_id
        );
        userdoc.Rtest_list = userdoc.Rtest_list.filter(
            (item) => item !== doc_id
        );
        await userdoc.save();

        // 카테고리에서 해당 문서 삭제
        const cat = await LowestCategory.findById(
            req.session.currentDocs.category_id
        );

        // Rpilgy_list, Rhoney_list, Rtest_list 중 doc_id가 있는 리스트에서 삭제
        cat.Rpilgy_list = cat.Rpilgy_list.filter((item) => item !== doc_id);
        cat.Rhoney_list = cat.Rhoney_list.filter((item) => item !== doc_id);
        cat.Rtest_list = cat.Rtest_list.filter((item) => item !== doc_id);
        await cat.save();

        // 성공 응답
        res.status(200).send("Document successfully deleted from lists");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleDeleteTips };
