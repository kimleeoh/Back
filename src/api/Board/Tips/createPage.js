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
            file_type: req.body.fileType,
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

        // 새로운 문서 생성
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
            { $inc: { written: 1 }, $push: { Rpilgy_list: doc._id } },
            { new: true }
        );
        console.log(lastCheck);

        res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};


// // TIP 게시글 작성 핸들러
// const handleTipCreate = async (req, res) => {
//     try {
//         const data = new PilgyDocuments(); // PilgyDocuments 스키마 인스턴스 생성
//         if (mainInquiry.isNotRedis) {
//             const a = redisHandler.getRedisClient();
//             mainInquiry.inputRedisClient(a);
//         }

//         const received = await mainInquiry.read(
//             ["_id", "hakbu", "POINT", "Rdoc"],
//             req.body.decryptedSessionId
//         );
//         console.log(received);
//         const linkList = [];
//         for (const a in req.body.images) {
//             linkList.push(await s3Handler.put(a, "/Q"));
//         }
//         // 1. 프론트엔드에서 데이터 수신
//         const {
//             decryptedSessionId,
//             title,
//             content,
//             now_category_list,
//             point,
//             time,
//             file,
//             filter,
//         } = req.body;
//         const receivedUser = await mainInquiry.read(
//             ["_id", "POINT", "Rdoc"],
//             decryptedSessionId
//         );

//         // 2. 파일 처리 (이미지 또는 PDF 업로드)
//         let preview_img = "";
//         let fileId = null;
//         if (file) {
//             const fileExtension = file.mimetype.split("/")[1]; // 파일 확장자 가져오기
//             const s3Path = `/files/`; // S3 저장 경로

//             // PDF 처리
//             if (fileExtension === "pdf") {
//                 const { link, preview } = await s3Handler.uploadPDFWithPreview(
//                     file,
//                     s3Path
//                 ); // PDF와 미리보기 이미지 처리
//                 preview_img = preview; // PDF 미리보기 이미지 링크
//                 fileId = await saveAllFiles(
//                     link,
//                     preview_img,
//                     "pdf",
//                     receivedUser._id
//                 );
//             } else {
//                 // 이미지 파일 처리
//                 const link = await s3Handler.uploadImage(file, s3Path);
//                 preview_img = link; // 이미지 링크
//                 fileId = await saveAllFiles(
//                     link,
//                     preview_img,
//                     "image",
//                     receivedUser._id
//                 );
//             }
//         }

//         // 3. 필터에 따라 다른 컬렉션에 게시글 저장
//         let documentId;
//         let docModel;

//         if (filter === 0) {
//             // 필기 공유 -> PilgyDocuments
//             docModel = PilgyDocuments;
//         } else if (filter === 1) {
//             // Test 공유 -> TestDocuments
//             docModel = TestDocuments;
//         } else if (filter === 2) {
//             // Honey 공유 -> HoneyDocuments
//             docModel = HoneyDocuments;
//         } else {
//             return res.status(400).json({ message: "잘못된 필터 값입니다." });
//         }

//         // 4. 선택된 컬렉션에 게시글 저장
//         const tipDoc = new docModel({
//             _id: new mongoose.Types.ObjectId(),
//             title,
//             content,
//             now_category: now_category_list,
//             point,
//             time,
//             Ruser: receivedUser._id,
//             preview_img,
//             Rfile: fileId,
//             views: 0,
//             likes: 0,
//             scrap: 0,
//             warn: 0,
//         });

//         await tipDoc.save();
//         documentId = tipDoc._id;

//         // 5. 사용자 문서에 작성 글 추가
//         const userUpdateField =
//             filter === 0
//                 ? "Rpilgy_list"
//                 : filter === 1
//                 ? "Rtest_list"
//                 : "Rhoney_list";

//         await UserDocs.findByIdAndUpdate(
//             receivedUser.Rdoc,
//             { $inc: { written: 1 }, $push: { [userUpdateField]: documentId } }, // 사용자의 필기, 테스트, 허니 리스트에 추가
//             { new: true }
//         );

//         // 6. 포인트 추가
//         if (point > 0) {
//             const newPoint = receivedUser.POINT + point;
//             await mainInquiry.write({ POINT: newPoint }, decryptedSessionId);
//         }

//         res.status(200).json({ message: "게시글 작성 완료" });
//     } catch (error) {
//         console.error("게시글 작성 중 오류 발생:", error);
//         res.status(500).json({ message: "서버 오류 발생" });
//     }
// };

// // AllFiles 문서 저장 함수
// const saveAllFiles = async (link, preview_img, fileType, userId) => {
//     const fileDoc = new AllFiles({
//         _id: new mongoose.Types.ObjectId(),
//         file_link: link,
//         preview_img,
//         file_type: fileType,
//         Ruser: userId,
//         time: new Date(),
//     });
//     await fileDoc.save();
//     return fileDoc._id;
// };

export { handleTipsCreate };
