import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; 
import { TestDocuments, PilgyDocuments, HoneyDocuments} from "../../../schemas/docs.js"; 
import { User } from "../../../schemas/user.js"; 

// 사용자 과목 따라서 게시물불러오기 
// 경우 1: 사용자가 필터를 선택하지 않았을 때 & 3개 선택했을 때 -> 각 4개씩 3세트 불러오기
// 경우 2: 사용자가 필터를 1개 선택했을 때 -> 12개 1세트 불러오기
// 경우 3: 사용자가 필터를 2개 선택했을 때 -> 6개 2세트 불러오기

// 필터에 따른 게시물 불러오기 로직
const loadBoardWithFilter = async (req, res) => {
    try {
        const { filters, type, id } = req.body;

        // 필터 값이 없으면 오류 반환
        if (!filters || filters.length === 0) {
            return res.status(400).json({ message: "No filters selected" });
        }

        // 해당 id로 CommonCategory에서 조회
        const category = await CommonCategory.findOne({ "_id": req.body.id[0] })
            .select("Rtest_list Rpilgy_list Rhoney_list")
            .lean();

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        let documents = [];

        // 타입에 따른 처리 (필터가 1개일 때는 'one', 0, 2, 3개일 때는 'many')
        if (type === "one" && filters.length === 1) {
            const filter = filters[0];
            documents = await getDocumentsByCategory(filter, 12, category);
        } 
        else if (type === "many" && (filters.length === 0 || filters.length > 1)) {
            // 필터가 없거나 2개 이상일 때는 카테고리마다 각각 문서를 가져오기
            if (filters.length === 0) {
                // 필터가 없으면 각 카테고리에서 4개씩
                const docsTest = await getDocumentsByCategory('test', 4, category);
                const docsPilgy = await getDocumentsByCategory('pilgy', 4, category);
                const docsHoney = await getDocumentsByCategory('honey', 4, category);
                documents = [...docsTest, ...docsPilgy, ...docsHoney];
            } 
            else if (filters.length === 2) {
                // 필터가 2개일 경우 각 필터에서 6개씩
                const docsFilter1 = await getDocumentsByCategory(filters[0], 6, category);
                const docsFilter2 = await getDocumentsByCategory(filters[1], 6, category);
                documents = [...docsFilter1, ...docsFilter2];
            } 
            else if (filters.length === 3) {
                // 필터가 3개일 경우 각 필터에서 4개씩
                const docsFilter1 = await getDocumentsByCategory(filters[0], 4, category);
                const docsFilter2 = await getDocumentsByCategory(filters[1], 4, category);
                const docsFilter3 = await getDocumentsByCategory(filters[2], 4, category);
                documents = [...docsFilter1, ...docsFilter2, ...docsFilter3];
            }
        }

        // 결과 반환
        res.json(documents);
    } catch (error) {
        console.error("Error fetching board data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// 특정 카테고리에서 지정된 수만큼 문서를 가져오는 함수
const getDocumentsByCategory = async (category, limit, categoryData) => {
    let documents = [];
    let docList = [];

    if (category === "test") {
        if (categoryData && categoryData.Rtest_list) {
            docList = categoryData.Rtest_list.sort({time:-1}).slice(-limit);
            documents = await TestDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" }) // Ruser에서 name 필드 가져오기
                .lean();
        }
    } else if (category === "pilgy") {
        if (categoryData && categoryData.Rpilgy_list) {
            docList = categoryData.Rpilgy_list.sort({ time: -1 }).slice(-limit);
            documents = await PilgyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" }) // Ruser에서 name 필드 가져오기
                .lean();
        }
    } else if (category === "honey") {
        if (categoryData && categoryData.Rhoney_list) {
            docList = categoryData.Rhoney_list.sort({ time: -1 }).slice(-limit);
            documents = await HoneyDocuments.find({ _id: { $in: docList } })
                .select(
                    "_id title preview_img content Ruser time views likes point"
                )
                .populate({ path: "Ruser", model: User, select: "name" }) // Ruser에서 name 필드 가져오기
                .lean();
        }
    }

    return documents;
};

export { loadBoardWithFilter };