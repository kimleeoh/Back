import mongoose from "mongoose";
import {
    AllFiles,
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../../../schemas/docs.js"; // 스키마 가져오기
import { UserDocs } from "../../../schemas/userRelated.js"; // UserDocs 스키마
import s3Handler from "../../../config/s3Handler.js"; // S3 파일 처리
import mainInquiry from "../../../functions/mainInquiry.js"; // 사용자 정보 처리

const handleTipsCreate = async (req, res) => {
    try {
        // Redis 클라이언트 설정 및 사용자 정보 가져오기
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(
            ["_id", "hakbu", "POINT", "Rdoc"],
            req.body.decryptedSessionId
        );

        // 이미지 처리
        const linkList = [];
        for (let i = 0; i < req.body.images.length; i++) {
            const imgLink = await s3Handler.put(req.body.images[i], "/P");
            linkList.push(imgLink);
            if (i === 0) preview_img = imgLink; // 첫 번째 이미지는 preview로 설정
        }

        // PDF 파일 처리 (첫 페이지 변환)
        if (req.body.fileType === "pdf") {
            const previewImage = await pdf2pic(req.body.images[0].path);
            preview_img = await s3Handler.put(previewImage, "/P");
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
        switch (req.body.type) {
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
                return res.status(400).send("Invalid document type");
        }

        // 새로운 문서 생성 (구매 포인트 포함)
        const doc = new DocumentsModel({
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
        const lastCheck = await UserDocs.findOneAndUpdate(
            { _id: received.Rdoc },
            { $inc: { written: 1 }, $push: { Rpilgy_list: doc._id } }, // Rpilgy_list 부분은 필터에 따라 동적으로 바꿀 수 있음
            { new: true }
        );
        console.log(lastCheck);

        res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleTipsCreate }