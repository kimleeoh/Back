// 사용자 과목 따라서 게시물불러오기 
// 경우 1: 사용자가 필터를 선택하지 않았을 때 & 3개 선택했을 때 -> 각 4개씩 3세트 불러오기
// 경우 2: 사용자가 필터를 1개 선택했을 때 -> 12개 1세트 불러오기
// 경우 3: 사용자가 필터를 2개 선택했을 때 -> 6개 2세트 불러오기

import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js";
import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
} from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js";

// 사용자 과목에 따른 게시물 불러오기 로직
const loadBoardWithFilter = async (req, res) => {
    try {
        const { filters, id } = req.body;

        // 필터 값이 없으면 오류 반환
        if (!filters || filters.length === 0) {
            return res.status(400).json({ message: "No filters selected" });
        }

        // 각 필터에 해당하는 카테고리 데이터를 가져오기
        const categories = await CommonCategory.find({ _id: { $in: id } })
            .select("Rtest_list Rpilgy_list Rhoney_list")
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        // 필터링된 과목 목록에 따라 문서를 가져오는 로직
        for (const filter of filters) {
            const category = categories.find((cat) => cat._id.equals(filter));

            if (!category) continue;

            // 과목의 3가지 카테고리에서 게시물을 필터에 맞게 가져옴
            const docsTest = await getDocumentsByCategory(
                "test",
                category,
                filters.length
            );
            const docsPilgy = await getDocumentsByCategory(
                "pilgy",
                category,
                filters.length
            );
            const docsHoney = await getDocumentsByCategory(
                "honey",
                category,
                filters.length
            );

            // 결과 배열에 각 카테고리별 문서를 추가
            documents.push(...docsTest, ...docsPilgy, ...docsHoney);
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
    } else if (filterCount === 3) {
        limit = 4; // 필터가 3개일 경우 4개씩
    }

    // 카테고리별로 게시물 가져오기
    if (categoryType === "test") {
        if (categoryData.Rtest_list) {
            docList = categoryData.Rtest_list.sort({ time: -1 }).slice(
                0,
                limit
            );
            documents = await TestDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" })
                .lean();
        }
    } else if (categoryType === "pilgy") {
        if (categoryData.Rpilgy_list) {
            docList = categoryData.Rpilgy_list.sort({ time: -1 }).slice(
                0,
                limit
            );
            documents = await PilgyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" })
                .lean();
        }
    } else if (categoryType === "honey") {
        if (categoryData.Rhoney_list) {
            docList = categoryData.Rhoney_list.sort({ time: -1 }).slice(
                0,
                limit
            );
            documents = await HoneyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" })
                .lean();
        }
    }

    return documents;
};

export { loadBoardWithFilter };
