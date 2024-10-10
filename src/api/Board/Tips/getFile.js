import {
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js";
import { AllFiles } from "../../../schemas/docs.js"; // AllFiles 스키마 가져오기

// 통합 파일 조회 API
const getFileByDocumentId = async (req, res) => {
    try {
        const { documentId, docType } = req.params; // 문서 ID와 타입을 파라미터로 받음

        let documentModel;

        // 문서 타입에 따라 적절한 모델 선택
        switch (docType) {
            case "pilgy":
                documentModel = PilgyDocuments;
                break;
            case "test":
                documentModel = TestDocuments;
                break;
            case "honey":
                documentModel = HoneyDocuments;
                break;
            default:
                return res
                    .status(400)
                    .json({ message: "Invalid document type" });
        }

        // 해당 문서의 정보를 찾음
        const document = await documentModel.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // 문서의 Rfile 필드에서 ObjectId로 AllFiles에서 파일 정보 가져옴
        const fileId = document.Rfile;
        const fileData = await AllFiles.findById(fileId);
        if (!fileData) {
            return res.status(404).json({ message: "File not found" });
        }

        // 파일의 링크를 클라이언트에 반환
        res.status(200).json({ file_link: fileData.file_link });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { getFileByDocumentId };
