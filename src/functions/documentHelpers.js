import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
    QnaDocuments
} from "../schemas/docs.js";
import { User } from "../schemas/user.js";
import { Category } from "../schemas/category.js";

const getCategoryTipsDocuments = async (
    categoryType,
    categoryData,
    limit,
    depth
) => {
    let model;
    let docList;

    console.log(categoryData);

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

    const end = -limit * (depth - 1) || undefined;
    const start = end == undefined ? -limit : end - limit;

    if (docList.length > limit) docList = docList.slice(start, end);
    else if (docList.length < limit && depth > 1) docList = [];

    console.log(start, end, docList);

    // 문서 조회 및 populate
    const documents = await model
        .find({ _id: { $in: docList } })
        .select(
            "_id title now_category target Ruser time views likes purchase_price"
        )
        .populate({ path: "Ruser", model: User, select: "name hakbu" })
        .lean();

    // now_category에 대한 _id와 category_name 추가
    for (const doc of documents) {
        if (doc.now_category) {
            const category = await Category.findOne({
                _id: doc.now_category,
            })
                .select("category_name")
                .lean();
            doc.now_category = category
                ? {
                    _id: doc.now_category,
                    category_type: categoryType,
                    category_name: category.category_name,
                }
                : {
                    _id: doc.now_category,
                    category_type: categoryType,
                    category_name: "Unknown Category",
                };
        }
    }

    console.log("doc", documents);

    return documents;
};

const getCategoryQnaDocuments = async (oneOrMany, categoryData, onlyA,limit, depth=1) => {
    const target = oneOrMany === "many" 
        ? onlyA=="true"? { 'Rcategory': { $in: categoryData }, 'restricted_type': true} : { 'Rcategory': { $in: categoryData } } 
        : { _id: { $in: categoryData } };

    let query = QnaDocuments.find(target)
                            .sort({ time: -1 });

    if (oneOrMany === "many") {
        const totalDocuments = await QnaDocuments.countDocuments(target); // Count total documents
        console.log("Total QnA Documents: ", totalDocuments);
        const skip = (depth - 1) * limit; // Adjust skip value
        console.log("Skip: ", skip);
        if(skip >= totalDocuments) return [];
        query = query.skip(skip);
    }

    query = query.limit(limit).select("_id title preview_img preview_content user_main time views likes point restricted_type now_category_list");

    const result = await query.lean();

    console.log("QnA Documents: ", result);
    return result
};

export { getCategoryTipsDocuments, getCategoryQnaDocuments };
