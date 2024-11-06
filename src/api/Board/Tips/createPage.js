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
        console.log("Received board data:", req.body.board);
        const nc = JSON.parse(req.body.board);
        // console.log("nc:", nc);
        const categoryId = Object.keys(nc[nc.length - 1])[0];
        // console.log("categoryid:", Object.keys(nc[nc.length - 1])[0]);

        // 고유한 ObjectId를 Rfile로 생성
        const Rfile = new mongoose.Types.ObjectId();
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
            ["_id", "hakbu", "name", "exp", "Rdoc"],
            req.decryptedSessionId
        );

        if (!received) {
            console.log("Invalid session ID:", req.decryptedSessionId);
            return res
                .status(400)
                .send("Error: No data found in Redis for the given session ID");
        }

        // 파일 업로드 및 삭제 처리
        const linkList = [];
        let preview_img = "";
        if (req.files && req.files.length > 0) {
            const isPDF = req.files[0].mimetype === "application/pdf";

            if (isPDF) {
                const pdfFile = req.files[0];
                if (fs.existsSync(pdfFile.path)) {
                    const fileStream = fs.createReadStream(pdfFile.path);
                    const pdfLink = await s3Handler.put("files", fileStream);
                    linkList.push(pdfLink);

                    // 업로드 후 파일 삭제
                    await fs.promises.unlink(pdfFile.path);
                } else {
                    console.error("PDF file not found:", pdfFile.path);
                    return res.status(500).send("PDF file not found");
                }
            } else {
                for (const file of req.files) {
                    if (fs.existsSync(file.path)) {
                        // 파일 경로 유효성 확인
                        const fileStream = fs.createReadStream(file.path);
                        const imgLink = await s3Handler.put(
                            "files",
                            fileStream
                        );
                        linkList.push(imgLink);

                        // 첫 번째 이미지를 preview에 저장
                        if (req.files.indexOf(file) === 0) {
                            preview_img = await s3Handler.put(
                                "preview",
                                fileStream
                            );
                            console.log("previewimg", preview_img);
                        }

                        // 파일 업로드 후 삭제
                        await fs.promises.unlink(file.path);
                    } else {
                        console.error("Image file not found:", file.path);
                        return res
                            .status(500)
                            .send(`Image file not found: ${file.path}`);
                    }
                }
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
            Rfile,
            preview_img,
            now_category: categoryId, // 문서가 속한 카테고리
            time: req.body.time,
            Ruser: received._id,
            user_main: `${received.hakbu} ${received.name}`,
            views: 0,
            likes: 0,
            scrap: 0,
            warn: 0,
            warn_why_list: [0, 0, 0, 0, 0, 0, 0, 0],
            purchase_price: req.body.purchase_price,
        });

        // exp 값에 30 더하기
        const newExp = (received.exp || 0) + 30;

        // exp 업데이트
        await mainInquiry.write({ exp: newExp }, req.decryptedSessionId);

        // 문서 저장 및 사용자 문서 리스트 업데이트
        await doc.save();
        console.log("Document saved:", doc._id, "now", doc.now_category);

        // AllFiles에 추가
        const allFileDoc = new AllFiles({
            _id: Rfile, // 문서의 Rfile 값을 AllFiles의 _id로 설정
            Rpurchase_list: [], // 초기화
            file_link_list: linkList, // 파일 링크 리스트 저장
        });
        await allFileDoc.save();
        console.log("allfile:", allFileDoc);

        const updatedUserDocs = await UserDocs.findOneAndUpdate(
            { _id: received.Rdoc },
            { $inc: { written: 1 }, $push: { [userListField]: doc._id } },
            { new: true }
        );
        // console.log("updateUserDocs", updatedUserDocs);

        if (!updatedUserDocs) {
            console.error("Failed to update UserDocs. Rdoc:", received.Rdoc);
            return res.status(500).send("Failed to update UserDocs");
        }

        const updateCommonCategory = await CommonCategory.findOneAndUpdate(
            { _id: categoryId }, // 추출한 categoryId 사용
            { $push: { [categoryListField]: doc._id } }, // 해당 카테고리 리스트에 문서 추가
            { new: true }
        );

        if (!updateCommonCategory) {
            console.error(
                "Failed to update CommonCategory. categoryId:",
                categoryId
            );
            return res.status(500).send("Failed to update CommonCategory");
        }
        // console.log("updateCommonCategory", updateCommonCategory);

        console.log("Document and category updated successfully");
        res.status(200).json({ message: "Success" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleTipsCreate };
