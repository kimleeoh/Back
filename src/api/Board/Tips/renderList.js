import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; 
import { TestDocuments } from "../../../schemas/docs.js"; 

// 사용자 과목 따라서 게시물불러오기 
// 경우 1: 사용자가 과목을 선택하지 않았을 때 & 3개 선택했을 때 -> 각 4개씩 3세트 불러오기
// 경우 2: 사용자가 과목을 1개 선택했을 때 -> 12개 1세트 불러오기
// 경우 3: 사용자가 과목을 2개 선택했을 때 -> 6개 2세트 불러오기

const testBoard = async (req, res) => {
    try {
        // commonCategorySchema에서 Rtest_list의 마지막 12개 문서 추출
        const category = await CommonCategory.findOne({})
            .select("Rtest_list")
            .lean();

        if (!category || !category.Rtest_list) {
            return res.status(404).json({ message: "Rtest_list not found" });
        }

        // Rtest_list에서 마지막 12개의 문서 ID 가져오기
        const last12DocIds = category.Rtest_list.slice(-12);

        // 해당 doc_id로 TestDocuments에서 필요한 정보 조회
        const docs = await TestDocuments.find({ _id: { $in: last12DocIds } })
            .select("_id title preview_img content Ruser time views likes point")
            .lean();

        // 결과 반환
        res.json(docs);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const pilgyBoard = async (req, res) => {
    try {
        // commonCategorySchema에서 Rpilgy_list의 마지막 12개 문서 추출
        const category = await CommonCategory.findOne({})
            .select("Rpilgy_list")
            .lean();

        if (!category || !category.Rpilgy_list) {
            return res.status(404).json({ message: "Rpilgy_list not found" });
        }
        // naDocuments.find("Rcategory":{$in:사용자과목리스트})

        // Rpilgy_list에서 마지막 12개의 문서 ID 가져오기
        const last12DocIds = category.Rpilgy_list.slice(-12);

        // 해당 doc_id로 PilgyDocuments에서 필요한 정보 조회
        const docs = await PilgyDocuments.find({ _id: { $in: last12DocIds } })
            .select(
                "_id title preview_img content Ruser time views likes point"
            )
            .lean();

        // 결과 반환
        res.json(docs);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const honeyBoard = async (req, res) => {
    try {
        // commonCategorySchema에서 Rhoney_list의 마지막 12개 문서 추출
        const category = await CommonCategory.findOne({})
            .select("Rhoney_list")
            .lean();

        if (!category || !category.Rhoney_list) {
            return res.status(404).json({ message: "Rhoney_list not found" });
        }

        // Rhoney_list에서 마지막 12개의 문서 ID 가져오기
        const last12DocIds = category.Rhoney_list.slice(-12);

        // 해당 doc_id로 HoneyDocuments에서 필요한 정보 조회
        const docs = await HoneyDocuments.find({ _id: { $in: last12DocIds } })
            .select(
                "_id title preview_img content Ruser time views likes point"
            )
            .lean();

        // 결과 반환
        res.json(docs);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { testBoard, pilgyBoard , honeyBoard};
