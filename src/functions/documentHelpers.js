import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
    QnaDocuments
} from "../schemas/docs.js";
import { User } from "../schemas/user.js";

const getCategoryTipsDocuments = async (categoryType, categoryData, limit, depth) => {
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
    const start = end==undefined? -limit : end - limit;

    // Rqna_list에서 마지막 20개의 문서 ID 가져오기

    if(docList.length>limit) docList = docList.slice(start, end);
    else if(docList.length<limit&&depth>1)docList=[];

    console.log(start,end,docList);

    // 문서 조회 및 populate
    const documents = await model
        .find({ '_id': { $in: docList } })
        .select(
        "_id title preview_img now_category target Ruser time views likes purchase_price"
        )
        .populate({ path: "Ruser", model: User, select: "name hakbu" })
        .lean();

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
