import mongoose from "mongoose";
import {
    AllFiles,
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../../../schemas/docs.js"; // 스키마 가져오기
import { UserDocs } from "../../../schemas/userRelated.js"; // UserDocs 스키마
import s3Handler from "../../../config/s3Handler.js"; // S3 파일 처리
import redisHandler from "../../../config/redisHandler.js"; // S3 파일 처리
import mainInquiry from "../../../functions/mainInquiry.js"; // 사용자 정보 처리
import { CommonCategory } from "../../../schemas/category.js";
import fs from "fs";

const handleTipsCreate = async (req, res) => {
    try {
        console.log("Session ID from client:", req.decryptedSessionId);
        if (!req.decryptedSessionId) {
            return res.status(400).send("세션 ID가 없습니다.");
        }

        if (!req.body.title || !req.body.content) {
            console.error("Missing required fields: title or content");
            return res.status(400).send("Missing required fields");
        }

        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const received = await mainInquiry.read(
            ["_id", "hakbu", "POINT", "Rdoc"],
            req.decryptedSessionId
        );

        if (!received) {
            console.log("Invalid session ID:", req.decryptedSessionId);
            return res
                .status(400)
                .send("Error: No data found in Redis for the given session ID");
        }

        const linkList = [];
        let preview_img = "";
        
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileStream = fs.createReadStream(file.path);
                const imgLink = await s3Handler.put(
                    "files",
                    fileStream
                );
                fs.unlinkSync(file.path)
                linkList.push(imgLink);
                if (i === 0) preview_img = imgLink;
            }
        } else {
            console.log("No images received, proceeding without images.");
        }

        // 문서 유형에 따라 Pilgy, Test, Honey 선택
        let DocumentsModel;
        let userListField;
        let categoryListField; // 카테고리에서 사용할 필드
        switch (req.body.type) {
            case "pilgy":
                DocumentsModel = PilgyDocuments;
                userListField = "Rpilgy_list";
                categoryListField = "Rpilgy_list"; // CommonCategory 업데이트 필드 설정
                break;
            case "test":
                DocumentsModel = TestDocuments;
                userListField = "Rtest_list";
                categoryListField = "Rtest_list";
                break;
            case "honey":
                DocumentsModel = HoneyDocuments;
                userListField = "Rhoney_list";
                categoryListField = "Rhoney_list";
                break;
            default:
                return res.status(400).send("Invalid document type");
        }

        // 새로운 문서 생성
        const doc = new DocumentsModel({
            _id: new mongoose.Types.ObjectId(),
            title: req.body.title,
            content: req.body.content,
            target: req.body.target,
            img_list: linkList,
            now_category_list: req.body.board, // 문서가 속한 카테고리
            time: req.body.time,
            Ruser: received._id,
            user_main: `${received.hakbu} ${req.decryptedUserData.name}`,
            user_img: req.decryptedUserData.profile_img,
            preview_img,
            views: 0,
            likes: 0,
            scrap: 0,
            warn: 0,
            warn_why_list: [0, 0, 0, 0, 0, 0, 0,0],
            purchase_price: req.body.purchase_price,
        });

        await mainInquiry.write(
            { POINT: received.POINT + 100 },
            req.decryptedSessionId
        );

        // 문서 저장 및 사용자 문서 리스트 업데이트
        await doc.save();
        console.log("Document saved:", doc._id); 
        
        const updatedUserDocs = await UserDocs.findOneAndUpdate(
            { _id: received.Rdoc },
            { $inc: { written: 1 }, $push: { [userListField]: doc._id } },
            { new: true }
        );
        console.log("updateUserDocs", updatedUserDocs);

        if (!updatedUserDocs) {
            console.error("Failed to update UserDocs. Rdoc:", received.Rdoc);
            return res.status(500).send("Failed to update UserDocs");
        }

        // CommonCategory에 문서 추가 (카테고리별 필드에 추가)
        let categoryId;
        const lastBoardElement = req.body.board[req.body.board.length - 1];

        // 마지막 요소가 객체일 경우 ObjectId만 추출
        if (typeof lastBoardElement === "object" && lastBoardElement !== null) {
            categoryId = Object.keys(lastBoardElement)[0]; // 객체의 key가 ObjectId일 것으로 가정
        } else {
            categoryId = lastBoardElement; // 이미 문자열 또는 ObjectId 형태일 경우 그대로 사용
        }

        const updateCommonCategory = await CommonCategory.findOneAndUpdate(
            { _id: categoryId }, // 추출한 categoryId 사용
            { $push: { [categoryListField]: doc._id } }, // 해당 카테고리 리스트에 문서 추가
            { new: true }
        );
        console.log("updateCommonCategory", updateCommonCategory);

        console.log("Document and category updated successfully");
        res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleTipsCreate }

