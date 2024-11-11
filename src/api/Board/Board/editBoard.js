import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";
import redisHandler from "../../../config/redisHandler.js";
import { rewardNullCheck } from "../../../functions/rewardCheck.js";
import { notify } from "../../../functions/notifier.js";

const handleEditBoard = async (req, res) => {
    // 프론트에서 {type:1(내가수강중)/2(즐겨찾기)/3(내가수강했던), subject: [{id, subject}]} 형식으로 요청이 옴
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 사용자 커스텀 보드 정보 가져오기
        const r = await mainInquiry.read(
            ["Renrolled_list", "Rbookmark_list", "Rlistened_list", "uNullRewardList"],
            req.decryptedSessionId
        );

        // subject 배열에서 id 값만 추출
        console.log(req.body.subject);
        const subjectIds = req.body.subject.map((subject) => subject.id);
        console.log(subjectIds);

        // 요청 타입에 따라 적절한 리스트에 저장
        let allNum =0;
        let willwrite = {};
        switch (req.body.type) {
            case 1:
                willwrite = {Renrolled_list: subjectIds};
                allNum = subjectIds.length + r.Rbookmark_list.length + r.Rlistened_list.length;
                break;

            case 2:
                willwrite = {Rbookmark_list: subjectIds};
                allNum = subjectIds.length + r.Renrolled_list + r.Rlistened_list.length;
                break;

            case 3:
                willwrite = {Rlistened_list: subjectIds};
                allNum = subjectIds.length + r.Rbookmark_list.length + r.Renrolled_list.length;
                break;
            default:
                console.log("error!!!!!!");
        }

        const m = rewardNullCheck(5, allNum, "", r.uNullRewardList);
        if(m.status){
            willwrite.uNullRewardList = m.uNullRewardList;
            await notify.Self(req.decryptedSessionId, m, "", 8, "", "");
        }

        await mainInquiry.write(willwrite, req.decryptedSessionId);

        res.status(200).send("OK"); // 성공 응답
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { handleEditBoard };
