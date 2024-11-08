import mongoose from "mongoose";
import {
    AllFiles,
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
} from "../../../schemas/docs.js"; // 스키마 가져오기
import { UserDocs } from "../../../schemas/userRelated.js"; // UserDocs 스키마
import s3Handler from "../../../config/s3Handler.js"; // S3 파일 처리
import redisHandler from "../../../config/redisHandler.js"; // Redis 파일 처리
import mainInquiry from "../../../functions/mainInquiry.js"; // 사용자 정보 처리
import { CommonCategory } from "../../../schemas/category.js";
import fs from "fs";
import { fromPath } from "pdf2pic"; // pdf2pic을 사용하여 PDF를 이미지로 변환

const handleTipsCreate = async (req, res) => {
    try {
        console.log("Received board data:", req.body.board);
        const nc = JSON.parse(req.body.board);
        const categoryId = Object.keys(nc[nc.length - 1])[0];

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

        const linkList = [];
        let preview_img = "";

        if (req.files && req.files.length > 0) {
            const isPDF = req.files[0].mimetype === "application/pdf";

            if (isPDF) {
                console.log("PDF detected, converting first page to image...");

                const pdfFile = req.files[0];
                const pdfPath = pdfFile.path;

                // pdf2pic 설정: 첫 번째 페이지만 변환
                const pdfConverter = fromPath(pdfPath, {
                    density: 100, // 해상도
                    saveFilename: pdfFile.filename, // 임시 파일 이름 설정
                    savePath: "./temp_images", // 저장할 경로
                    format: "jpeg", // 변환 포맷
                    width: 800, // 너비 설정
                    height: 1000, // 높이 설정
                });

                // 첫 번째 페이지만 변환하고 S3에 업로드
                const firstPage = await pdfConverter(1);
                const firstPageImage = firstPage.path;

                if (fs.existsSync(firstPageImage)) {
                    const fileStream = fs.createReadStream(firstPageImage);
                    preview_img = await s3Handler.put("preview", fileStream);

                    // 임시 이미지 파일 삭제
                    await fs.promises.unlink(firstPageImage);
                }

                // 원본 PDF 파일을 S3에 업로드하고 링크 저장
                const pdfFileStream = fs.createReadStream(pdfPath);
                const pdfLink = await s3Handler.put("files", pdfFileStream);
                linkList.push(pdfLink);

                // PDF 파일 삭제
                await fs.promises.unlink(pdfPath);
            } else {
                // 이미지 파일일 경우 처리
                for (const file of req.files) {
                    if (fs.existsSync(file.path)) {
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
        let categoryListField;
        switch (req.body.type) {
            case "pilgy":
                DocumentsModel = PilgyDocuments;
                userListField = "Rpilgy_list";
                categoryListField = "Rpilgy_list";
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
            now_category: categoryId,
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

        // 사용자 경험치 증가 및 문서 저장
        const newExp = (received.exp || 0) + 30;
        await mainInquiry.write({ exp: newExp }, req.decryptedSessionId);
        await doc.save();

        // AllFiles에 이미지 링크 저장
        const allFileDoc = new AllFiles({
            _id: Rfile,
            Rpurchase_list: [],
            file_link_list: linkList,
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
                console.error(
                    "Failed to update UserDocs. Rdoc:",
                    received.Rdoc
                );
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
