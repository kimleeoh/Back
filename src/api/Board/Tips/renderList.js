import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; 
import { TestDocuments } from "../../../schemas/docs.js"; 

// 사용자 과목 따라서 게시물불러오기 
// 경우 1: 사용자가 필터를 선택하지 않았을 때 & 3개 선택했을 때 -> 각 4개씩 3세트 불러오기
// 경우 2: 사용자가 필터를 1개 선택했을 때 -> 12개 1세트 불러오기
// 경우 3: 사용자가 필터를 2개 선택했을 때 -> 6개 2세트 불러오기

const loadBoardWithFilter = async (req, res) => {
    try {
        const { filters } = req.body; // 프론트에서 받은 필터 배열
        let documents = [];

        // 필터 배열의 길이에 따라 처리
        if (!filters || filters.length === 0) {
            return res.status(400).json({ message: "No filters selected" });
        }

        // 필터가 1개 선택되었을 때: 해당 필터에서 12개 가져오기
        if (filters.length === 1) {
            const filter = filters[0];
            documents = await getDocumentsByCategory(filter, 12);
        }
        // 필터가 2개 선택되었을 때: 각 필터에서 6개씩 가져오기
        else if (filters.length === 2) {
            const filter1 = filters[0];
            const filter2 = filters[1];

            const docsFilter1 = await getDocumentsByCategory(filter1, 6);
            const docsFilter2 = await getDocumentsByCategory(filter2, 6);

            documents = [...docsFilter1, ...docsFilter2];
        }
        // 필터가 3개 선택되었을 때: 각 필터에서 4개씩 가져오기
        else if (filters.length === 3) {
            const filter1 = filters[0];
            const filter2 = filters[1];
            const filter3 = filters[2];

            const docsFilter1 = await getDocumentsByCategory(filter1, 4);
            const docsFilter2 = await getDocumentsByCategory(filter2, 4);
            const docsFilter3 = await getDocumentsByCategory(filter3, 4);

            documents = [...docsFilter1, ...docsFilter2, ...docsFilter3];
        }

        // 결과 반환
        res.json(documents);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 특정 카테고리에서 지정된 수만큼 문서를 가져오는 함수
const getDocumentsByCategory = async (category, limit) => {
    let documents = [];
    let docList = [];

    // 각 카테고리별로 문서를 조회
    if (category === "test") {
        const categoryData = await CommonCategory.findOne({})
            .select("Rtest_list")
            .lean();
        if (categoryData && categoryData.Rtest_list) {
            docList = categoryData.Rtest_list.slice(-limit);
            documents = await TestDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .lean();
        }
    } else if (category === "pilgy") {
        const categoryData = await CommonCategory.findOne({})
            .select("Rpilgy_list")
            .lean();
        if (categoryData && categoryData.Rpilgy_list) {
            docList = categoryData.Rpilgy_list.slice(-limit);
            documents = await PilgyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .lean();
        }
    } else if (category === "honey") {
        const categoryData = await CommonCategory.findOne({})
            .select("Rhoney_list")
            .lean();
        if (categoryData && categoryData.Rhoney_list) {
            docList = categoryData.Rhoney_list.slice(-limit);
            documents = await HoneyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .lean();
        }
    }

    return documents;
};

export { loadBoardWithFilter };