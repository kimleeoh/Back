import mongoose from "mongoose";
import { getCategoryTipsDocuments } from "../../functions/documnentHelpers.js";
import { QnaDocuments } from "../../schemas/docs.js";
import { CommonCategory } from "../../schemas/category.js"; // CommonCategory 가져오기

const loadBoardDetail = async (req, res) => {
    const { subjectId, filters } = req.body; // 프론트로부터 과목 ID와 필터 받기

    try {
        // 과목 ID로 CommonCategory에서 해당 과목 정보 조회
        const subjectCategory = await CommonCategory.findOne({
            _id: subjectId,
        }).lean();

        if (!subjectCategory) {
            return res.status(404).json({ message: "Subject not found" });
        }

        const { Rqna_list, Rpilgy_list, Rtest_list, Rhoney_list } =
            subjectCategory; // 각 리스트 추출
        let documents = [];

        // 필터 값에 따른 문서 조회
        for (const filter of filters) {
            let categoryType, listField, documentList;

            // QnA 필터 처리
            if (filter === "qna") {
                const qnaDocs = await QnaDocuments.find({
                    _id: { $in: Rqna_list },
                }).lean();
                documents.push(
                    ...qnaDocs.map((doc) => ({
                        ...doc,
                        category_type: "qna",
                        category_name: subjectCategory.category_name,
                    }))
                );
            }
            // Test, Pilgy, Honey 처리
            else {
                if (filter === "test") {
                    categoryType = "test";
                    documentList = Rtest_list;
                    listField = "Rtest_list";
                } else if (filter === "pilgy") {
                    categoryType = "pilgy";
                    documentList = Rpilgy_list;
                    listField = "Rpilgy_list";
                } else if (filter === "honey") {
                    categoryType = "honey";
                    documentList = Rhoney_list;
                    listField = "Rhoney_list";
                }

                // Test, Pilgy, Honey에 해당하는 문서 조회
                if (documentList) {
                    const docsFromCategory = await getCategoryTipsDocuments(
                        categoryType,
                        { [listField]: documentList },
                        12 // 최대 12개의 문서 조회
                    );

                    documents.push(
                        ...docsFromCategory.map((doc) => ({
                            ...doc,
                            category_type: categoryType,
                            category_name: subjectCategory.category_name,
                        }))
                    );
                }
            }
        }

        // 문서가 없을 경우 빈 배열 응답
        if (documents.length === 0) {
            return res.status(200).json({ message: "No documents found." });
        }

        // 문서와 함께 응답
        res.status(200).json({ documents });
    } catch (error) {
        console.error("Error fetching subject content:", error);
        res.status(500).json({ message: "Failed to retrieve subject content" });
    }
};

export { loadBoardDetail };
