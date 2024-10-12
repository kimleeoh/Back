import { User } from "../../schemas/user.js"; // 유저 스키마
import { UserDocs } from "../../schemas/userRelated.js"; // 유저 스키마
// import {}
import redisHandler from "../../config/redisHandler.js"; // Redis 핸들러
import mainInquiry from "../../functions/mainInquiry.js";


// GET /api/mypage
const handleUserProfile = async (req, res) => {
    try {
        // Redis에서 사용자 정보를 가져옴
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const decryptedSessionId = String(req.body.decryptedSessionId);

        // paramList 및 Redis에서 가져올 필드 설정
        const paramList = ["_id", "name", "intro", "level", "Rdoc", "hakbu"];
        console.log("Requested params:", paramList);
        
        let userInfo;
        try {
            // Redis에서 _id와 Rcustom_brd를 가져옴
            userInfo = await mainInquiry.read(paramList, decryptedSessionId);
            console.log("User info from Redis:", userInfo);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // req.user가 제대로 존재하는지 먼저 확인
        if (!decryptedSessionId && !userInformation) {
            console.log("req.user is undefined:", req.user);
            return res.status(400).json({ message: "유저 정보가 없습니다." });
        }

        const name = userInfo.name || "Unknown"; // 기본값 설정
        const level = userInfo.exp || 0; // 기본값 0 설정
        const intro = userInfo.intro || "소개가 없습니다"; // 기본값 설정

        // 2. UserDocs 스키마에서 Rpilgy_list, Rhoney_list, Rtest_list, Rreply_list 가져오기
        const userDocs = await UserDocs.findOne({ _id: userInfo.Rdoc });
        console.log("Fetched userDocs:", userDocs);
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "유저의 문서를 찾을 수 없습니다." });
        }

        // 작성한 팁 수
        const tipsCount =
            userDocs.Rpilgy_list.length +
            userDocs.Rhoney_list.length +
            userDocs.Rtest_list.length;

        // 작성한 답변 수
        const replyCount = userDocs.Rreply_list.length;

        // 레벨

        // 3. 클라이언트에 전달할 데이터
        res.status(200).json({
            name,
            hakbu,
            level,
            intro,
            tipsCount,
            replyCount,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

// 회원 정보 수정 비즈니스 로직
const updateUserProfile = async (sessionId, updatedData) => {
    try {
        // Redis에서 세션 정보로 유저 정보 가져오기
        const redisUser = await redisHandler.get(sessionId);

        if (!redisUser) {
            throw new Error("Invalid session");
        }

        // MongoDB에서 유저 _id 가져오기
        const userId = redisUser._id;

        // MongoDB에서 유저 정보 업데이트
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updatedData },
            { new: true } // 업데이트 후 변경된 데이터 반환
        );

        if (!updatedUser) {
            throw new Error("Failed to update user information");
        }

        // Redis 캐시에 업데이트된 유저 정보 저장
        await redisHandler.set(sessionId, updatedUser);

        return updatedUser;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export { handleUserProfile, updateUserProfile };