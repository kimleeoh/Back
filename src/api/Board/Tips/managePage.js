import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
    AllFiles,
} from "../../../schemas/docs.js";
import mainInquiry from '../../../functions/mainInquiry.js'; // 세션에서 유저 정보 가져오기

const checkIsUserTips = async (req, res) => {
    try {
        const decryptedSessionId = String(req.decryptedSessionId);
        console.log("decryptedSessionId: ", decryptedSessionId); // 세션 ID 확인

        const { docid, category_type } = req.body;
        const paramList = ["_id"]; // 필요한 필드 (유저 ID)

        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const userInfo = await mainInquiry.read(paramList, decryptedSessionId); // 세션에서 유저 정보 가져오기

        if (!userInfo || !userInfo._id) {
            return res.status(400).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // category_type에 따라 적절한 Documents 스키마 선택
        let documentSchema;
        switch (category_type) {
            case "pilgy":
                documentSchema = PilgyDocuments;
                break;
            case "honey":
                documentSchema = HoneyDocuments;
                break;
            case "test":
                documentSchema = TestDocuments;
                break;
            default:
                return res
                    .status(400)
                    .send({ message: "Invalid category_type" });
        }

        // 문서 정보 가져오기
        const document = await documentSchema.findById(docid);
        if (!document) {
            return res.status(404).send({ message: "Document not found" });
        }

        // 자신의 글인지 확인
        const userId = userInfo._id; // 세션에서 가져온 유저 ID
        console.log("Document Ruser: ", document.Ruser, "User ID: ", userId); // Ruser와 userId 비교 확인
        const isOwner = String(document.Ruser) === String(userId);

        // 자신의 글이면 "Mine" 메시지 반환
        if (isOwner) {
            return res.status(200).json({ message: "Mine" });
        }

        // 구매 여부 확인
        const fileIds = document.Rfile;
        const purchasedFiles = await AllFiles.find({
            _id: { $in: fileIds },
            Rpurchase_list: userId,
        });
        const hasPurchased = purchasedFiles.length > 0;

        // 남의 글이지만 내가 산 글이면 "Not Mine, Purchased" 메시지 반환
        if (hasPurchased) {
            return res.status(200).json({ message: "Not Mine, Purchased" });
        }

        // 남의 글이고 내가 안 산 글이면 "Not Mine, Not Purchased" 메시지 반환
        return res.status(200).json({ message: "Not Mine, Not Purchased" });
    } catch (error) {
        console.error("Error checking document:", error);
        res.status(500).send("Server Error");
    }
};

export { checkIsUserTips};
