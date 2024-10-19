import { User } from "../../schemas/user.js"; // 유저 스키마
import { UserDocs } from "../../schemas/userRelated.js"; // 유저 스키마
// import {}
import redisHandler from "../../config/redisHandler.js"; // Redis 핸들러
import mainInquiry from "../../functions/mainInquiry.js";


const handleUserProfile = async (req, res) => {
    try {
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const decryptedSessionId = String(req.decryptedSessionId);
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

        // Redis에서 가져온 데이터 중 값이 없는 경우 기존 값을 유지
        const level =
            userInfo.level !== undefined
                ? userInfo.level
                : previousUserInfo.level;
        const Rdoc =
            userInfo.Rdoc !== undefined ? userInfo.Rdoc : previousUserInfo.Rdoc;
        const hakbu =
            userInfo.hakbu !== undefined
                ? userInfo.hakbu
                : previousUserInfo.hakbu;

        const name = userInfo.name || "Unknown";
        const intro = userInfo.intro || "소개가 없습니다";

        // UserDocs 조회
        const userDocs = await UserDocs.findOne({ _id: Rdoc });
        if (!userDocs) {
            return res
                .status(404)
                .json({ message: "유저의 문서를 찾을 수 없습니다." });
        }

        const tipsCount =
            userDocs.Rpilgy_list.length +
            userDocs.Rhoney_list.length +
            userDocs.Rtest_list.length;
        const replyCount = userDocs.Rreply_list.length;

        res.status(200).json({
            name,
            hakbu,
            level,
            intro,
            tipsCount,
            replyCount,
            profile: req.decryptedUserData.profile,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
};

const updateUserProfile = async (req, res) => {
    const { name, intro } = req.body;
    const decryptedSessionId = String(req.decryptedSessionId);

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
        const userInfo = await mainInquiry.read(
            ["_id", "level", "Rdoc", "hakbu"],
            decryptedSessionId
        );
        if (!userInfo || !userInfo._id) {
            return res
                .status(400)
                .json({ message: "유효하지 않은 세션입니다." });
        }

        // Redis 캐시에 업데이트된 정보 반영
        await mainInquiry.write(
            {
                name,
                intro,
            },
            decryptedSessionId
        );

        res.status(200).json({
            message: "프로필이 성공적으로 업데이트되었습니다.",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({
            message: "프로필 업데이트 중 오류가 발생했습니다.",
        });
    }
};

export { handleUserProfile, updateUserProfile };