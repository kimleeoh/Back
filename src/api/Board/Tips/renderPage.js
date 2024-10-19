import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../../../schemas/docs.js";
import { AllFiles } from "../../../schemas/files.js";
import mainInquiry from "../../../functions/mainInquiry.js";

const handleRenderTipsPage = async (req, res) => {
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

        // 구매 여부 확인
        const fileIds = document.Rfile;
        const purchasedFiles = await AllFiles.find({
            _id: { $in: fileIds },
            Rpurchase_list: Ruser._id,
        });
        const hasPurchased = purchasedFiles.length > 0;

        // 자신의 글인지 확인
        const isOwner = String(document.Ruser) === String(Ruser._id);

        // 게시물이 구매되었거나, 사용자가 게시물의 작성자인 경우
        if (hasPurchased || isOwner) {
            // 디테일한 정보 반환
            const detailData = {
                id: document._id,
                title: document.title,
                content: document.content,
                likes: document.likes,
                now_category: document.now_category,
                Ruser: document.Ruser,
                scrap: document.scrap,
                views: document.views + 1, // 조회수 증가
                time: document.time,
                warn: document.warn,
                warn_why_list: document.warn_why_list,
                purchase_price: document.purchase_price,
            };
            // 조회수 증가
            document.views += 1;
            await document.save();

            return res.status(200).json(detailData);
        } else {
            // 미리보기 정보 반환
            const previewData = {
                id: document._id,
                title: document.title,
                target: document.target,
                now_category: document.now_category,
                Ruser: document.Ruser,
                likes: document.likes,
                preview_img: document.preview_img,
                scrap: document.scrap,
                views: document.views + 1, // 조회수 증가
                time: document.time,
                warn: document.warn,
                warn_why_list: document.warn_why_list,
                purchase_price: document.purchase_price,
            };
            // 조회수 증가
            document.views += 1;
            await document.save();

            return res.status(200).json(previewData);
        }
    } catch (error) {
        console.error("Error rendering tips page:", error);
        res.status(500).send("Server Error");
    }
};

export { handleRenderTipsPage };
