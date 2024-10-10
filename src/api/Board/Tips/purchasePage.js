// 구매 버튼을 누를시
// 사용자 _id를 받은 세션 id를 통해 여차저차(전에 여러번 쓴 방법 아시죠?)
// 사용자의 user문서에 접근한 뒤 포인트 차감
// 해당 게시글의 _id를 통해 Rfile의 _id를 얻고 
// 그걸 토대로 Rpurchase리스트에 유저 _id추가 거기에 있는 파일 링크를 통해서 자동 다운시킴.

import { UserDocs } from "../../../schemas/userRelated.js"; // 사용자 관련 문서 모델
import mainInquiry from "../../../functions/mainInquiry.js"; // Redis 사용자 세션 관리

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