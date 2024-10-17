import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";
import redisHandler from "../../../config/redisHandler.js";

const handleEditBoard = async (req, res) => {
    // 프론트에서 {type:1(내가수강중)/2(즐겨찾기)/3(내가수강했던), subject: [{id, subject}]} 형식으로 요청이 옴
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 사용자 커스텀 보드 정보 가져오기
        const r = await mainInquiry.read(
            ["Rcustom_brd"],
            req.decryptedSessionId
        );

        // subject 배열에서 id 값만 추출
        const subjectIds = req.body.subject.map((item) => item.id);

        // 요청 타입에 따라 적절한 리스트에 저장
        switch (req.body.type) {
            case 1:
                await CustomBoardView.findByIdAndUpdate(r.Rcustom_brd, {
                    Renrolled_list: subjectIds,
                });
                break;

            case 2:
                await CustomBoardView.findByIdAndUpdate(r.Rcustom_brd, {
                    Rbookmark_list: subjectIds,
                });
                break;

            case 3:
                await CustomBoardView.findByIdAndUpdate(r.Rcustom_brd, {
                    Rlistened_list: subjectIds,
                });
                break;
        }

        res.status(200).send("OK"); // 성공 응답
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleEditBoard };
