// // 게시물 눌렀을 때 각 게시물 띄우는 페이지
// 프론트가 백에 어느 종류 게시판인지 보내는 데이터에 넣어서 알려줘야함. ex)test - 0, pilgy -1, honey - 2

// doc id 통해서 값 불러오고, 
// 그 값의 Rfile이 “”인지 값이 있는지 확인
// 잇다면 그거를 AllFiles 콜렉션에 조회
// Rpurchasedlist에 해당 유저의 _id가 있는지 조회, 있다면 파일 다운 상태로 해제(프론트 역할) 

// 해당하는 콜렉션에 쿼리 후 조회수 1 늘리고(update, new 키워드 적용시 바뀐 데이터 자동으로 반환시켜줌) 반환되는 데이터 저장, 해당 doc 정보 담을(좋아요, 스크랩 등) 생성

import { UserDocs } from "../../../schemas/userRelated.js"; // 사용자 관련 문서 모델
import mainInquiry from "../../../functions/mainInquiry.js"; // Redis 사용자 세션 관리

// 파일 구매전적 조회 및 Boolean 반환
const checkPurchaseAndGetFiles = async (req, res) => {
    try {
        const { documentId, type } = req.params; // 문서 ID와 문서 타입
        const { decryptedSessionId } = req.body; // 세션 ID

        // Redis에서 사용자 정보 조회
        const redisClient = mainInquiry.getRedisClient();
        const received = await mainInquiry.read(
            ["_id", "Rdoc"],
            decryptedSessionId
        );

        // UserDocs에서 사용자가 해당 파일을 이미 구매했는지 확인
        const userDoc = await UserDocs.findById(received._id).select(
            "Rpurchasedlist"
        );
        if (userDoc.Rpurchasedlist.includes(documentId)) {
            // 이미 구매한 경우
            const documentModel = getDocumentModel(type); // 문서 타입에 맞는 모델 가져오기
            const document = await documentModel
                .findById(documentId)
                .select("Rfile");
            const fileData = await AllFiles.findById(document.Rfile);

            return res
                .status(200)
                .json({ purchased: true, file_link: fileData.file_link });
        }

        // 구매하지 않은 경우
        res.status(200).json({ purchased: false });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

// boolean 값 받아서 false라면 포인트차감 후 전체파일 다운로드
const downloadFileWithCheck = async (req, res) => {
    try {
        const { documentId, type } = req.params; // 문서 ID와 문서 타입
        const { decryptedSessionId } = req.body; // 세션 ID
        const downloadCost = 10; // 포인트 차감 비용 (예시)

        // Redis에서 사용자 정보 조회
        const redisClient = mainInquiry.getRedisClient();
        const received = await mainInquiry.read(
            ["_id", "POINT", "Rdoc"],
            decryptedSessionId
        );

        // UserDocs에서 해당 사용자의 Rpurchasedlist 확인
        const userDoc = await UserDocs.findById(received._id).select(
            "Rpurchasedlist"
        );
        if (userDoc.Rpurchasedlist.includes(documentId)) {
            // 이미 파일을 구매한 경우
            return res.status(200).json({ purchased: true, file_link: null });
        }

        // 포인트 확인 후 차감 처리
        if (received.POINT < downloadCost) {
            return res.status(400).json({ message: "Not enough points" });
        }

        let documentModel;
        switch (type) {
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

        // 문서 조회 및 파일 정보 확인
        const document = await documentModel.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const fileId = document.Rfile;
        const fileData = await AllFiles.findById(fileId);
        if (!fileData) {
            return res.status(404).json({ message: "File not found" });
        }

        // 포인트 차감
        const newPoint = received.POINT - downloadCost;
        await mainInquiry.write({ POINT: newPoint }, decryptedSessionId);

        // 구매 목록에 문서 추가
        await UserDocs.findByIdAndUpdate(received._id, {
            $push: { Rpurchasedlist: documentId },
        });

        // 파일 링크를 클라이언트에 반환
        res.status(200).json({
            purchased: false,
            file_link: fileData.file_link,
        });
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { downloadFileWithCheck, checkPurchaseAndGetFiles};