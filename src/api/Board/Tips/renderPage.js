import {
    PilgyDocuments,
    HoneyDocuments,
    TestDocuments,
    AllFiles
} from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js"; // User 스키마 가져오기

const handleRenderTipsPage = async (req, res) => {
    try {
        const { docid, category_type } = req.params;

        // category_type에 따라 적절한 Documents 스키마 선택
        let documentSchema;
        switch (category_type) {
            case "pilgy":
                documentSchema = PilgyDocuments;
                break;
            case "honey":
                documentSchema = HoneyDocuments;
                break;
            case "test":
                documentSchema = TestDocuments;
                break;
            default:
                return res
                    .status(400)
                    .send({ message: "Invalid category_type" });
        }

        // 문서 정보 가져오기
        const document = await documentSchema.findById(docid).lean();
        if (!document) {
            return res.status(404).send({ message: "Document not found" });
        }

        // Ruser를 통해 사용자 정보 조회
        const user = await User.findById(document.Ruser)
            .select("name hakbu")
            .lean();
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Rfile을 통해 파일 정보 조회
        const file = await AllFiles.findById(document.Rfile)
            .select("file_link_list")
            .lean();
        if (!file) {
            return res.status(404).send({ message: "File not found" });
        }

        // 문서의 필요한 정보만 클라이언트로 전송
        const responseData = {
            id: document._id,
            title: document.title,
            content: document.content,
            likes: document.likes,
            views: document.views + 1, // 조회수 증가
            time: document.time,
            warn: document.warn,
            warn_why_list: document.warn_why_list,
            purchase_price: document.purchase_price,
            user: {
                // user의 name과 hakbu를 포함
                name: user.name,
                hakbu: user.hakbu,
            },
            file_links: file.file_link_list, // file의 link 리스트 포함
        };

        // 조회수 증가 처리
        document.views += 1;
        await documentSchema.findByIdAndUpdate(docid, {
            views: document.views,
        });

        // 응답 전송
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching document details:", error);
        res.status(500).send("Server Error");
    }
};

export { handleRenderTipsPage };
