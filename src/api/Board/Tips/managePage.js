import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
    AllFiles,
} from "../../../schemas/docs.js";

const checkIsUserTips = async (req, res) => {
    try {
        const { docid, Ruser, category_type } = req.params;

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
        const userId = Ruser._id ? Ruser._id : Ruser; // Ruser가 객체면 _id 사용, 아니면 바로 Ruser
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
