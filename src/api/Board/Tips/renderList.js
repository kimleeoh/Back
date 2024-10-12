import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { User } from "../../../schemas/user.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";

const loadBoardWithFilter = async (req, res) => {
    try {
        let { filters } = req.body;

        // 필터 값이 없으면 기본적으로 3개의 필터 적용 (test, pilgy, honey)
        if (!filters || filters.length === 0) {
            filters = ["test", "pilgy", "honey"];
        }

        // Redis에서 사용자 정보를 가져옴
        if (mainInquiry.isNotRedis()) {
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }

        const decryptedSessionId = String(req.body.decryptedSessionId);

        // paramList 및 Redis에서 가져올 필드 설정
        const paramList = ["_id", "Rcustom_brd"];
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

        // 여기에 customBoard 변수를 try-catch 밖에서 선언
        let customBoard;

        try {
            // Rcustom_brd 값 로그 출력 (디버깅용)
            console.log("Rcustom_brd:", userInfo.Rcustom_brd);

            // Rcustom_brd가 없는 경우 에러 반환
            if (!userInfo.Rcustom_brd) {
                return res
                    .status(400)
                    .json({ message: "Rcustom_brd not set for the user" });
            }

            // Rcustom_brd를 사용하여 CustomBoardView 조회
            customBoard = await CustomBoardView.findOne({
                _id: userInfo.Rcustom_brd,
            })
                .select("Renrolled_list Rbookmark_list Rlistened_list")
                .lean();

            // Custom board가 없는 경우 에러 반환
            if (!customBoard) {
                return res
                    .status(404)
                    .json({ message: "Custom board not found" });
            }

            console.log("Custom board found:", customBoard); // 디버깅용 로그 추가
        } catch (error) {
            console.error("Error retrieving custom board:", error);
            return res.status(500).json({ message: "Internal server error" });
        }

        // 중복 제거하여 과목 ID 리스트 생성
        const allSubjectIds = [
            ...customBoard.Renrolled_list,
            ...customBoard.Rbookmark_list,
            ...customBoard.Rlistened_list,
        ];

        const uniqueSubjectIds = [...new Set(allSubjectIds)]; // 중복 제거

        // CommonCategory에서 해당 과목 ID의 Rtest_list, Rpilgy_list, Rhoney_list 가져오기
        const categories = await CommonCategory.find({
            _id: { $in: uniqueSubjectIds },
        })
            .select("Rtest_list Rpilgy_list Rhoney_list")
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        // 필터 값에 따른 카테고리 처리 (test, pilgy, honey를 필터로 사용)
        for (const filter of filters) {
            if (filter === "test") {
                for (const category of categories) {
                    const docsTest = await getDocumentsByCategory(
                        "test",
                        category,
                        filters.length
                    );
                    documents.push(...docsTest);
                }
            } else if (filter === "pilgy") {
                for (const category of categories) {
                    const docsPilgy = await getDocumentsByCategory(
                        "pilgy",
                        category,
                        filters.length
                    );
                    documents.push(...docsPilgy);
                }
            } else if (filter === "honey") {
                for (const category of categories) {
                    const docsHoney = await getDocumentsByCategory(
                        "honey",
                        category,
                        filters.length
                    );
                    documents.push(...docsHoney);
                }
            }
        }

        res.json(documents);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 특정 카테고리에서 지정된 수만큼 문서를 가져오는 함수
const getDocumentsByCategory = async (
    categoryType,
    categoryData,
    filterCount
) => {
    let documents = [];
    let docList = [];

    // 필터에 따라 가져올 개수 결정
    let limit;
    if (filterCount === 1) {
        limit = 12; // 필터가 1개일 경우 12개씩
    } else if (filterCount === 2) {
        limit = 6; // 필터가 2개일 경우 6개씩
    } else if (filterCount === 3 || filterCount === 0) {
        limit = 4; // 필터가 0개 또는 3개일 경우 4개씩
    }

    // 카테고리별로 게시물 가져오기
    if (categoryType === "test") {
        docList = categoryData.Rtest_list.slice().reverse().slice(0, limit); 
        documents = await TestDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img content Ruser time views likes purchase_price"
            )
            .populate({ path: "Ruser", model: User, select: "name hakbu" })
            .lean();
    } else if (categoryType === "pilgy") {
        docList = categoryData.Rpilgy_list.slice().reverse().slice(0, limit); 
        documents = await PilgyDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img content Ruser time views likes purchase_price"
            )
            .populate({ path: "Ruser", model: User, select: "name hakbu" })
            .lean();
    } else if (categoryType === "honey") {
        docList = categoryData.Rhoney_list.slice().reverse().slice(0, limit); 
        documents = await HoneyDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img content Ruser time views likes purchase_price"
            )
            .populate({ path: "Ruser", model: User, select: "name hakbu" })
            .lean();
    }

    return documents;
};

export { loadBoardWithFilter };
