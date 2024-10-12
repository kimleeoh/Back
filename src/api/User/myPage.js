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

        // const name = userInfo.name || "Unknown"; // 기본값 설정
        // const level = userInfo.exp || 0; // 기본값 0 설정
        // const intro = userInfo.intro || "소개가 없습니다"; // 기본값 설정
                const {
                    name = "Unknown",
                    intro = "소개가 없습니다",
                    level = 0,
                    hakbu = "",
                } = userInfo;


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

// 사용자 프로필 수정
const updateUserProfile = async (req, res) => {
    const { decryptedSessionId, name, intro } = req.body;

    if (!decryptedSessionId) {
        return res.status(400).json({ message: "세션 ID가 없습니다." });
    }

    try {
        // Redis 클라이언트 설정
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        // Redis에서 사용자 정보 가져오기
        const userInfo = await mainInquiry.read(["_id"], decryptedSessionId);
        if (!userInfo || !userInfo._id) {
            return res.status(400).json({ message: "유효하지 않은 세션입니다." });
        }

        const userId = userInfo._id;
        
        // MongoDB에서 사용자 정보 업데이트
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { name, intro } }, // name과 intro 업데이트
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        // Redis 캐시에 업데이트된 정보 반영
        await redisHandler.set(decryptedSessionId, { ...userInfo, name, intro });

        res.status(200).json({
            message: "프로필이 성공적으로 업데이트되었습니다.",
            user: updatedUser,
        });
        // res.status(200).json({
        //     message: "프로필이 성공적으로 업데이트되었습니다.",
        //     user: updatedUser,
        // });

    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "프로필 업데이트 중 오류가 발생했습니다." });
    }
};


export { handleUserProfile, updateUserProfile };