import mongoose from "mongoose";
import {
    AllFiles,
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../../../schemas/docs.js"; // 스키마 가져오기
import { UserDocs } from "../../../schemas/userRelated.js"; // UserDocs 스키마
import s3Handler from "../../../config/s3Handler.js"; // S3 파일 처리
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js"; // 사용자 정보 처리

const handleTipsCreate = async (req, res) => {
    try {
        // 클라이언트에서 전달된 세션 ID 로그 출력
        console.log("Session ID from client:", req.body.decryptedSessionId);
        if (!req.body.decryptedSessionId) {
            return res.status(400).send("세션 ID가 없습니다.");
        }
        // Redis 클라이언트 설정 및 사용자 정보 가져오기
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(
            ["_id", "hakbu", "POINT", "Rdoc"],
            req.body.decryptedSessionId
        );

        // 세션 정보가 없을 때
        if (!received) {
            console.log("Invalid session ID:", req.body.decryptedSessionId);
            return res
                .status(400)
                .send("Error: No data found in Redis for the given session ID");
        }

        // 이미지 처리
        const linkList = [];
        let preview_img = ""; // 미리보기 이미지 초기화
        for (let i = 0; i < req.body.images.length; i++) {
            const imgLink = await s3Handler.put(req.body.images[i], "/files");
            linkList.push(imgLink);
            if (i === 0) preview_img = imgLink; // 첫 번째 이미지는 preview로 설정
        }

        // PDF 파일 처리 (첫 페이지 변환)
        if (req.body.fileType === "pdf") {
            const previewImage = await pdf2pic(req.body.images[0].path);
            preview_img = await s3Handler.put(previewImage, "/preview");
        }

        // AllFiles에 파일 저장
        const allFiles = new AllFiles({
            file_link: linkList[0], // 첫 번째 파일 링크
            // file_type: req.body.fileType,
            Ruser: received._id,
        });
        await allFiles.save();

        // 문서 유형에 따라 Pilgy, Test, Honey 선택
        let DocumentsModel;
        let userListField; // 사용자 문서 리스트 필드 (Rpilgy_list, Rtest_list, Rhoney_list)
        switch (req.body.type) {
            case "pilgy":
                DocumentsModel = PilgyDocuments;
                userListField = "Rpilgy_list"; // Pilgy 문서 리스트
                break;
            case "test":
                DocumentsModel = TestDocuments;
                userListField = "Rtest_list"; // Test 문서 리스트
                break;
            case "honey":
                DocumentsModel = HoneyDocuments;
                userListField = "Rhoney_list"; // Honey 문서 리스트
                break;
            default:
                return res.status(400).send("Invalid document type");
        }

        // 새로운 문서 생성 (구매 포인트 포함)
        const doc = new DocumentsModel({
            _id: new mongoose.Types.ObjectId(),
            title: req.body.title,
            content: req.body.content,
            img_list: linkList,
            now_category_list: req.body.board,
            time: req.body.time,
            Ruser: received._id,
            user_main: `${received.hakbu} ${req.body.decryptedUserData.name}`,
            user_img: req.body.decryptedUserData.profile_img,
            preview_img,
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
        // 사용자 문서 리스트 업데이트 (type에 따라 다르게 추가)
        const lastCheck = await UserDocs.findOneAndUpdate(
            { _id: received.Rdoc },
            {
                $inc: { written: 1 }, // 작성 문서 수 증가
                $push: { [userListField]: doc._id }, // 유형에 따른 리스트에 추가 (Rpilgy_list, Rtest_list, Rhoney_list)
            },
            { new: true }
        );
        console.log("UserDocs updated:", lastCheck);

        res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleTipsCreate }