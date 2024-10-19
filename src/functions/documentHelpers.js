import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
    QnaDocuments
} from "../schemas/docs.js";
import { User } from "../schemas/user.js";

const getCategoryTipsDocuments = async (categoryType, categoryData, limit) => {
    let model;
    let docList;

    // 카테고리에 맞는 모델 설정
    if (categoryType === "test") {
        model = TestDocuments;
        docList = categoryData.Rtest_list;
    } else if (categoryType === "pilgy") {
        model = PilgyDocuments;
        docList = categoryData.Rpilgy_list;
    } else if (categoryType === "honey") {
        model = HoneyDocuments;
        docList = categoryData.Rhoney_list;
    }

    // docList가 배열인지 확인
    if (!Array.isArray(docList)) {
        docList = []; // 배열이 아닌 경우 빈 배열로 처리
    }
    console.log("docList: ", docList);

    // 문서 조회 및 populate
    const documents = await model
        .find({ _id: { $in: docList.slice().reverse().slice(0, limit) } })
        .limit(limit) // 제한된 수의 문서만 가져옴
        .select(
            "_id title preview_img target Ruser time views likes purchase_price"
        )
        .populate({ path: "Ruser", model: User, select: "name hakbu" })
        .lean();

    return documents;
};

const getCategoryQnaDocuments = async (oneOrMany, categoryData, limit, depth=1) => {
    const target = oneOrMany === "many" 
        ? { 'Rcategory': { $in: categoryData } } 
        : { _id: { $in: categoryData } };

    let query = QnaDocuments.find(target)
                            .select("_id title preview_img preview_content user_main time views likes point restricted_type now_category_list")
                            .sort({ time: -1 });

    if (oneOrMany === "many") {
        const skip = (depth - 1) * limit;
        query = query.skip(skip);
    }

    query = query.limit(limit);

    return await query;
};

export { getCategoryTipsDocuments, getCategoryQnaDocuments };
