import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../../functions/documentHelpers.js"; // 모듈에서 함수 가져오기
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";
import { CommonCategory } from "../../../schemas/category.js"; // 카테고리 모델 불러오기

// 필터를 통해 게시판 데이터 로드
const loadBoardPage = async (req, res) => {
    try {
        // Redis에서 사용자 정보를 가져옴
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const decryptedSessionId = String(req.decryptedSessionId);

        // Redis에서 필요한 유저 정보(_id, Rcustom_brd) 읽기
        const paramList = ["_id", "Rcustom_brd", "Renrolled_list", "Rbookmark_list", "Rlistened_list"];
        let userInfo;
        try {
            userInfo = await mainInquiry.read(paramList, decryptedSessionId);
        } catch (error) {
            return res.status(500).json({
                message: "Failed to retrieve user information from Redis",
            });
        }

        // 유저가 설정한 커스텀 보드 가져오기
        const {Renrolled_list,Rbookmark_list,Rlistened_list, ...thers} = userInfo;

        // 1. 각 리스트의 ObjectId 가져오기

        // 2. ObjectId로 category_name 조회
        const enrolledCategories = await CommonCategory.find(
            {
                _id: { $in: Renrolled_list }
            })
            .select("_id category_name")
            .lean();
            
        console.log(enrolledCategories);

        const bookmarkCategories = await CommonCategory.find({
            _id: { $in: Rbookmark_list },
        })
            .select("_id category_name")
            .lean();

        const listenedCategories = await CommonCategory.find({
            _id: { $in: Rlistened_list },
        })
            .select("_id category_name")
            .lean();

        // 3. 각 board_type에 따른 데이터 형식 구성 및 원래 순서대로 정렬
        const formatCategories = (categories, ids) =>{
            if(ids.length === 0) return [];

            return ids.map((id) => {
                const category = categories.find(
                    (category) => String(category._id) === String(id)
                );

                if(category) {return {
                    id: category._id, // _id를 id로 변환
                    name: category.category_name,
                };}else{return null;}
            }).filter(item=>item!=null);}

        const response = {
            enroll: formatCategories(enrolledCategories, Renrolled_list),
            bookmark: formatCategories(bookmarkCategories, Rbookmark_list),
            listened: formatCategories(listenedCategories, Rlistened_list),
        };
        console.log(response);

        // 4. 프론트로 데이터 전송
        res.status(200).send(response);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { loadBoardPage };
