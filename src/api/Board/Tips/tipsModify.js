import fs from "fs";
import {
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js"; // 각 스키마 가져오기
import s3Handler from "../../../config/s3Handler.js"; // s3Handler 사용
import notify from "../../../functions/notify.js"; // 알림 처리
import { Category } from "../../../schemas/category.js"; // Category 스키마

const handleManageUpdateTipsPage = async (req, res) => {
    const { id, board, target, purchase_price, content, title, category_type } = req.body;
    
    try {
        let DocumentsModel;

        let categoryId;
        const lastBoardElement = req.body.board[req.body.board.length - 1];

        // 마지막 요소가 객체일 경우 ObjectId만 추출
        if (typeof lastBoardElement === "object" && lastBoardElement !== null) {
            categoryId = Object.keys(lastBoardElement)[0]; // 객체의 key가 ObjectId일 것으로 가정
        } else {
            categoryId = lastBoardElement; // 이미 문자열 또는 ObjectId 형태일 경우 그대로 사용
        }
        console.log("categoryId: " + categoryId);

        // category_type에 따라 문서 스키마 선택
        switch (category_type) {
            case "pilgy":
                DocumentsModel = PilgyDocuments;
                break;
            case "test":
                DocumentsModel = TestDocuments;
                break;
            case "honey":
                DocumentsModel = HoneyDocuments;
                break;
            default:
                return res.status(400).send("Invalid category_type");
        }

        // 문서 ID로 해당 문서 찾기
        const doc = await DocumentsModel.findById(id);
        if (!doc) {
            return res.status(404).send("Document not found");
        }

        // 문서의 제목과 내용을 업데이트
        doc.content = content;
        doc.now_category = categoryId;
        doc.target = target;
        doc.purchase_price = purchase_price;
        doc.title = title;
        doc.time = Date.now(); // 현재 시간으로 업데이트

        // 변경된 문서 저장
        await doc.save();

        // 알림 전송 (팔로워들에게)
        await notify.Follower(
            doc.Rnotifyusers_list,
            doc._id,
            doc.title,
            req.decryptedUserData.name,
            1
        );

        // 성공 메시지 전송
        res.status(200).send("Successfully updated");
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleManageUpdateTipsPage };
