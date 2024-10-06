import { User } from "../../schemas/user.js"; // 유저 스키마
import redisHandler from "../../config/redisHandler.js"; // Redis 핸들러

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

export { updateUserProfile };