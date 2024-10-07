// import { User } from "../../schemas/user.js"; // 유저 스키마
// import { UserDocs } from "../../schemas/userRelated.js"; // 유저 스키마
// // import {}
// import redisHandler from "../../config/redisHandler.js"; // Redis 핸들러

// // 1. 미들웨어에서 decodedSessionId를 받아서 
// // 2. isnotRedis가 true일때 redisHandler.getRedisClient()로 클라이언트 가져오기
// // 3. mainInquiry.Read로 유저 정보 가져오기

// // GET /api/mypage
// const handleUserProfile = async (req, res) => {
//     try {
//         // req.user가 제대로 존재하는지 먼저 확인
//         if (!req.body.user) {
//             console.log("req.user is undefined:", req.user);
//             return res.status(400).json({ message: "유저 정보가 없습니다." });
//         }

//         // 1. User 스키마에서 name, exp, intro 가져오기
//         const user = await User.findById(req.body.user.id);
//         console.log("Fetched user:", user);
//         if (!user) {
//             return res
//                 .status(404)
//                 .json({ message: "유저를 찾을 수 없습니다." });
//         }

//         const name = user.name || "Unknown"; // 기본값 설정
//         const exp = user.exp || 0; // 기본값 0 설정
//         const intro = user.intro || "소개가 없습니다"; // 기본값 설정

//         // 2. UserDocs 스키마에서 Rpilgy_list, Rhoney_list, Rtest_list, Rreply_list 가져오기
//         const userDocs = await UserDocs.findOne({ _id: req.user.id });
//         console.log("Fetched userDocs:", userDocs);
//         if (!userDocs) {
//             return res
//                 .status(404)
//                 .json({ message: "유저의 문서를 찾을 수 없습니다." });
//         }

//         const tipsCount =
//             userDocs.Rpilgy_list.length +
//             userDocs.Rhoney_list.length +
//             userDocs.Rtest_list.length;

//         const replyCount = userDocs.Rreply_list.length;

//         // 3. 클라이언트에 전달할 데이터
//         res.status(200).json({
//             name,
//             exp,
//             intro,
//             tipsCount,
//             replyCount,
//         });
//     } catch (error) {
//         console.error("Error fetching user profile:", error);
//         res.status(500).json({ message: "서버 오류가 발생했습니다." });
//     }
// };

// // 회원 정보 수정 비즈니스 로직
// const updateUserProfile = async (sessionId, updatedData) => {
//     try {
//         // Redis에서 세션 정보로 유저 정보 가져오기
//         const redisUser = await redisHandler.get(sessionId);

//         if (!redisUser) {
//             throw new Error("Invalid session");
//         }

//         // MongoDB에서 유저 _id 가져오기
//         const userId = redisUser._id;

//         // MongoDB에서 유저 정보 업데이트
//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             { $set: updatedData },
//             { new: true } // 업데이트 후 변경된 데이터 반환
//         );

//         if (!updatedUser) {
//             throw new Error("Failed to update user information");
//         }

//         // Redis 캐시에 업데이트된 유저 정보 저장
//         await redisHandler.set(sessionId, updatedUser);

//         return updatedUser;
//     } catch (error) {
//         console.error("Error updating user profile:", error);
//         throw error;
//     }
// };

// export { handleUserProfile, updateUserProfile };