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

        // uniqueSubjectIds가 null 또는 빈 배열일 경우 처리
        if (!uniqueSubjectIds || uniqueSubjectIds.length === 0) {
            return res
                .status(200)
                .json({ message: "uniqueSubjectIds is null or empty" });
        }

        // 필터에 맞게 조회할 필드 설정
        let selectFields = "category_name"; // category_name 추가
        if (filters.includes("test")) selectFields += " Rtest_list";
        if (filters.includes("pilgy")) selectFields += " Rpilgy_list";
        if (filters.includes("honey")) selectFields += " Rhoney_list";

        // 필터에 맞춰 해당 리스트만 조회, category_name도 추가
        const categories = await CommonCategory.find({
            _id: { $in: uniqueSubjectIds },
        })
            .select(selectFields.trim()) // 필요한 필드만 조회
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        // 모든 카테고리의 목록이 필터에 맞는 값에 대해 null인지 확인
        const emptyLists = categories.every((category) => {
            if (filters.includes("test") && !category.Rtest_list) return true;
            if (filters.includes("pilgy") && !category.Rpilgy_list) return true;
            if (filters.includes("honey") && !category.Rhoney_list) return true;
            return false;
        });

        if (emptyLists) {
            return res
                .status(200)
                .json({ message: "Filtered category lists are null" });
        }
        let documents = [];

        // 필터 값에 따른 카테고리 처리 및 category_name, category_type 추가
        for (const filter of filters) {
            if (filter === "test") {
                for (const category of categories) {
                    const docsTest = await getDocumentsByCategory(
                        "test",
                        category,
                        filters.length
                    );
                    // 각 문서에 category_name, category_type 추가
                    docsTest.forEach((doc) => {
                        doc.category_name = category.category_name;
                        doc.category_type = "test";
                    });
                    documents.push(...docsTest);
                }
            } else if (filter === "pilgy") {
                for (const category of categories) {
                    const docsPilgy = await getDocumentsByCategory(
                        "pilgy",
                        category,
                        filters.length
                    );
                    // 각 문서에 category_name, category_type 추가
                    docsPilgy.forEach((doc) => {
                        doc.category_name = category.category_name;
                        doc.category_type = "pilgy";
                    });
                    documents.push(...docsPilgy);
                }
            } else if (filter === "honey") {
                for (const category of categories) {
                    const docsHoney = await getDocumentsByCategory(
                        "honey",
                        category,
                        filters.length
                    );
                    // 각 문서에 category_name, category_type 추가
                    docsHoney.forEach((doc) => {
                        doc.category_name = category.category_name;
                        doc.category_type = "honey";
                    });
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
                "_id title preview_img target Ruser time views likes purchase_price"
            )
            .populate({ path: "Ruser", model: User, select: "name hakbu" })
            .lean();
    } else if (categoryType === "pilgy") {
        docList = categoryData.Rpilgy_list.slice().reverse().slice(0, limit); 
        documents = await PilgyDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img target Ruser time views likes purchase_price"
            )
            .populate({ path: "Ruser", model: User, select: "name hakbu" })
            .lean();
    } else if (categoryType === "honey") {
        docList = categoryData.Rhoney_list.slice().reverse().slice(0, limit); 
        documents = await HoneyDocuments.find({ _id: { $in: docList } })
            .select(
                "_id title preview_img target Ruser time views likes purchase_price"
            )
            .populate({ path: "Ruser", model: User, select: "name hakbu" })
            .lean();
    }

    return documents;
};

export { loadBoardWithFilter };
