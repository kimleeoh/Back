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

// TIP 게시글 작성 핸들러
const handleTipCreate = async (req, res) => {
    try {
        // 1. 프론트엔드에서 데이터 수신
        const {
            decryptedSessionId,
            title,
            content,
            now_category_list,
            point,
            time,
            file,
            filter,
        } = req.body;
        const receivedUser = await mainInquiry.read(
            ["_id", "POINT", "Rdoc"],
            decryptedSessionId
        );

        // 2. 파일 처리 (이미지 또는 PDF 업로드)
        let preview_img = "";
        let fileId = null;
        if (file) {
            const fileExtension = file.mimetype.split("/")[1]; // 파일 확장자 가져오기
            const s3Path = `/files/`; // S3 저장 경로

            // PDF 처리
            if (fileExtension === "pdf") {
                const { link, preview } = await s3Handler.uploadPDFWithPreview(
                    file,
                    s3Path
                ); // PDF와 미리보기 이미지 처리
                preview_img = preview; // PDF 미리보기 이미지 링크
                fileId = await saveAllFiles(
                    link,
                    preview_img,
                    "pdf",
                    receivedUser._id
                );
            } else {
                // 이미지 파일 처리
                const link = await s3Handler.uploadImage(file, s3Path);
                preview_img = link; // 이미지 링크
                fileId = await saveAllFiles(
                    link,
                    preview_img,
                    "image",
                    receivedUser._id
                );
            }
        }

        // 3. 필터에 따라 다른 컬렉션에 게시글 저장
        let documentId;
        let docModel;

        if (filter === 0) {
            // 필기 공유 -> PilgyDocuments
            docModel = PilgyDocuments;
        } else if (filter === 1) {
            // Test 공유 -> TestDocuments
            docModel = TestDocuments;
        } else if (filter === 2) {
            // Honey 공유 -> HoneyDocuments
            docModel = HoneyDocuments;
        } else {
            return res.status(400).json({ message: "잘못된 필터 값입니다." });
        }

        // 4. 선택된 컬렉션에 게시글 저장
        const tipDoc = new docModel({
            _id: new mongoose.Types.ObjectId(),
            title,
            content,
            now_category: now_category_list,
            point,
            time,
            Ruser: receivedUser._id,
            preview_img,
            Rfile: fileId,
            views: 0,
            likes: 0,
            scrap: 0,
            warn: 0,
        });

        await tipDoc.save();
        documentId = tipDoc._id;

        // 5. 사용자 문서에 작성 글 추가
        const userUpdateField =
            filter === 0
                ? "Rpilgy_list"
                : filter === 1
                ? "Rtest_list"
                : "Rhoney_list";

        await UserDocs.findByIdAndUpdate(
            receivedUser.Rdoc,
            { $inc: { written: 1 }, $push: { [userUpdateField]: documentId } }, // 사용자의 필기, 테스트, 허니 리스트에 추가
            { new: true }
        );

        // 6. 포인트 추가
        if (point > 0) {
            const newPoint = receivedUser.POINT + point;
            await mainInquiry.write({ POINT: newPoint }, decryptedSessionId);
        }

        res.status(200).json({ message: "게시글 작성 완료" });
    } catch (error) {
        console.error("게시글 작성 중 오류 발생:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
};

// AllFiles 문서 저장 함수
const saveAllFiles = async (link, preview_img, fileType, userId) => {
    const fileDoc = new AllFiles({
        _id: new mongoose.Types.ObjectId(),
        file_link: link,
        preview_img,
        file_type: fileType,
        Ruser: userId,
        time: new Date(),
    });
    await fileDoc.save();
    return fileDoc._id;
};

export { handleTipCreate };
