import { QnaDocuments } from "../../schemas/docs.js";
import { CommonCategory } from "../../schemas/category.js";
import { getCategoryTipsDocuments } from "../../functions/documnentHelpers.js";
import mongoose from "mongoose";
import { Queue } from "../../utils/recentPageClass.js"; // Queue 클래스 활용

// 세션 내 recentRead 큐를 초기화하는 함수
const initializeRecentReadQueue = (session) => {
    if (!session.recentRead || !(session.recentRead instanceof Queue)) {
        session.recentRead = new Queue(); // Queue 객체로 초기화
    }
};

// GET 요청 처리: recentRead 조회
const handleRecentRead = async (req, res) => {
    try {
        // 세션에 recentRead 큐가 없으면 초기화
        initializeRecentReadQueue(req.session);

        const recentRead = req.session.recentRead; // Queue 객체
        let documents = [];

        // 큐의 첫 번째 노드부터 순차적으로 처리
        let currentNode = recentRead.head;
        while (currentNode !== null) {
            const doc_id = currentNode.value;

            // doc_id에 '{'나 '}'가 포함된 경우 제외
            if (doc_id.includes("{") || doc_id.includes("}")) {
                currentNode = currentNode.next;
                continue;
            }

            // QnA 문서 조회
            const qnaDoc = await QnaDocuments.findOne({
                _id: mongoose.Types.ObjectId(doc_id),
            }).lean();
            if (qnaDoc) {
                documents.push({
                    type: "qna",
                    _id: qnaDoc._id,
                    title: qnaDoc.title,
                    preview_content: qnaDoc.preview_content,
                    time: qnaDoc.time,
                });
            } else {
                // Tips 문서 조회
                const tipDoc = await getCategoryTipsDocumentsForRecentRead(
                    doc_id
                );
                if (tipDoc) {
                    documents.push(tipDoc);
                }
            }

            currentNode = currentNode.next; // 다음 노드로 이동
        }

        // 문서가 없으면 빈 배열 응답
        if (documents.length === 0) {
            return res.status(200).json({
                message: "No documents found",
                documents: [],
            });
        }

        // 성공적으로 문서 정보 반환
        res.status(200).json({
            message: "Recent documents found",
            documents: documents,
        });
    } catch (error) {
        console.error("Error fetching recent documents:", error);
        res.status(500).json({
            message: "Failed to retrieve recent documents",
        });
    }
};

const getCategoryTipsDocumentsForRecentRead = async (doc_id) => {
    // 각 카테고리별 문서 조회
    const pilgyDoc = await getCategoryTipsDocuments(
        "pilgy",
        { Rpilgy_list: [doc_id] },
        1
    );
    const honeyDoc = await getCategoryTipsDocuments(
        "honey",
        { Rhoney_list: [doc_id] },
        1
    );
    const testDoc = await getCategoryTipsDocuments(
        "test",
        { Rtest_list: [doc_id] },
        1
    );

    const tipDoc = pilgyDoc[0] || honeyDoc[0] || testDoc[0];

    if (tipDoc) {
        let categoryType;
        if (pilgyDoc[0]) {
            categoryType = "pilgy";
        } else if (honeyDoc[0]) {
            categoryType = "honey";
        } else if (testDoc[0]) {
            categoryType = "test";
        }

        // getCategoryTipsDocuments에서 이미 필요한 정보를 반환하므로 추가 가공 불필요
        return {
            type: "tips",
            ...tipDoc, // 필요한 문서 정보 그대로 반환
            category_type: categoryType,
        };
    }

    return null;
};

// // 게시글 클릭 시 세션에 큐로 저장
// const handlePostClick = (req, res) => {
//     const { doc_id } = req.params; // 게시글의 doc_id

//     // 세션에 recentRead 큐가 없으면 초기화
//     initializeRecentReadQueue(req.session);

//     const recentRead = req.session.recentRead;

//     // 중복되지 않으면 추가
//     if (!recentRead.contains(doc_id)) {
//         // 큐의 크기가 10개를 초과하면 가장 오래된 항목 제거
//         if (recentRead.getSize() >= 10) {
//             recentRead.dequeue();
//         }

//         // 새로운 doc_id를 큐에 추가
//         recentRead.enqueue(doc_id);
//     }

//     res.status(200).json({
//         message: "Doc ID added to recentRead list",
//         recentRead: recentRead, // 큐를 그대로 반환
//     });
// };

export { handleRecentRead };
