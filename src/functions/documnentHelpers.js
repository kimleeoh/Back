import {
    TestDocuments,
    PilgyDocuments,
    HoneyDocuments,
} from "../schemas/docs.js";
import { User } from "../schemas/user.js";

export const getCategoryDocuments = async (categoryType, docList, limit) => {
    let model;

    // 카테고리에 맞는 모델 설정
    if (categoryType === "test") {
        model = TestDocuments;
    } else if (categoryType === "pilgy") {
        model = PilgyDocuments;
    } else if (categoryType === "honey") {
        model = HoneyDocuments;
    }

    // 문서 조회 및 populate
    const documents = await model
        .find({ _id: { $in: docList.slice().reverse().slice(0, limit) } })
        .select(
            "_id title preview_img target Ruser time views likes purchase_price"
        )
        .populate({ path: "Ruser", model: User, select: "name hakbu" })
        .lean();

    return documents;
};
