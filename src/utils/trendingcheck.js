// import redisHandler from "../config/redisHandler.js";

// import { updateMyPopularPostsCache } from "./trending.js";

// // 캐시 갱신을 직접 실행 (서버에서)
// updateMyPopularPostsCache()
//     .then(() => console.log("Popular posts cache updated successfully"))
//     .catch((error) =>
//         console.error("Error updating popular posts cache:", error)
//     );

// // Redis에서 캐시된 인기 게시물 확인용 API
// const getCachedPopularPosts = async (req, res) => {
//     try {
//         // Redis 클라이언트 설정
//         const redisClient = redisHandler.getRedisClient();

//         // Redis에서 'my_popular_posts' 키에 저장된 데이터 가져오기
//         const cachedPopularPosts = await redisClient.get("my_popular_posts");

//         if (cachedPopularPosts) {
//             return res.status(200).json(JSON.parse(cachedPopularPosts)); // JSON 형식으로 응답
//         } else {
//             return res
//                 .status(404)
//                 .json({ message: "No popular posts found in cache" });
//         }
//     } catch (error) {
//         console.error("Error fetching popular posts from Redis:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };

// export { getCachedPopularPosts };
