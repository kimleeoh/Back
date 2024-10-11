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

const handleTipsCreate = async (req, res) => {
    try {
        // 클라이언트에서 전달된 세션 ID 로그 출력
        console.log("Session ID from client:", req.body.decryptedSessionId);
        if (!req.body.decryptedSessionId) {
            return res.status(400).send("세션 ID가 없습니다.");
        }

        // 여기서 데이터가 유효한지 확인하고, 문제시 로그 출력
        if (!req.body.title || !req.body.content) {
            console.error("Missing required fields: title or content");
            return res.status(400).send("Missing required fields");
        }

        // Redis에서 사용자 정보 가져오기
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(
            ["_id", "hakbu", "POINT", "Rdoc"],
            req.body.decryptedSessionId
        );

        if (!received) {
            console.log("Invalid session ID:", req.body.decryptedSessionId);
            return res
                .status(400)
                .send("Error: No data found in Redis for the given session ID");
        }

        // 이미지 관련 로직: 이미지가 없을 경우에도 처리되도록 수정
        const linkList = [];
        let preview_img = "";

        if (req.files && req.files.length > 0) {
            // 이미지가 있는 경우 처리
            for (let i = 0; i < req.files.length; i++) {
                const imgLink = await s3Handler.put(
                    "/files",
                    req.files[i].buffer
                ); // S3에 파일 업로드
                linkList.push(imgLink);
                if (i === 0) preview_img = imgLink; // 첫 번째 이미지를 미리보기로 설정
            }
        } else {
            console.log("No images received, proceeding without images.");
        }

        // 문서 유형에 따라 Pilgy, Test, Honey 선택
        let DocumentsModel;
        let userListField;
        switch (req.body.type) {
            case "pilgy":
                DocumentsModel = PilgyDocuments;
                userListField = "Rpilgy_list";
                break;
            case "test":
                DocumentsModel = TestDocuments;
                userListField = "Rtest_list";
                break;
            case "honey":
                DocumentsModel = HoneyDocuments;
                userListField = "Rhoney_list";
                break;
            default:
                return res.status(400).send("Invalid document type");
        }

        // 새로운 문서 생성
        const doc = new DocumentsModel({
            _id: new mongoose.Types.ObjectId(),
            title: req.body.title,
            content: req.body.content,
            img_list: linkList, // 이미지가 없으면 빈 배열로 처리됨
            now_category_list: req.body.board,
            time: req.body.time,
            Ruser: received._id,
            user_main: `${received.hakbu} ${req.body.decryptedUserData.name}`,
            user_img: req.body.decryptedUserData.profile_img,
            preview_img, // 미리보기 이미지가 없으면 빈 값으로 설정됨
            views: 0,
            likes: 0,
            scrap: 0,
            warn: 0,
            purchase_price: req.body.purchase_price,
        });

        // 사용자 포인트 추가
        await mainInquiry.write(
            { POINT: received.POINT + 100 },
            req.body.decryptedSessionId
        );

        // 문서 저장 및 사용자 문서 리스트 업데이트
        await doc.save();
        const updatedUserDocs = await UserDocs.findOneAndUpdate(
            { _id: received.Rdoc },
            {
                $inc: { written: 1 },
                $push: { [userListField]: doc._id },
            },
            { new: true }
        );
        console.log("updated:",updatedUserDocs);
        res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleTipsCreate }