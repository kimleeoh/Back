import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; // 경로는 환경에 맞게 설정하세요
import { QnaDocuments } from "../../../schemas/docs.js"; // 경로는 환경에 맞게 설정하세요
import { getCategoryQnaDocuments } from "../../../functions/documnentHelpers.js";

const handleRenderQnaList = async (req, res) => {
//{type:"one"/"many", depth:1, id:[category_id]} 형식으로 요청
  const depth = req.body.depth || 1;
  try {
    let DocIDs;
    if(req.body.type=="one"){
      // commonCategorySchema에서 Rqna_list의 마지막 20개 문서 추출
      const category = await CommonCategory.findOne({"_id":req.body.id[0]})
        .select("Rqna_list")
        .lean();

      if (!category || !category.Rqna_list) {
        return res.status(404).json({ message: "Rqna_list not found" });
      }
      
      const end = -12 * (depth - 1) || undefined;
      const start = end - 12;

      // Rqna_list에서 마지막 20개의 문서 ID 가져오기
      DocIDs = category.Rqna_list.slice(start, end);
      // 해당 doc_id로 QnaDocuments에서 필요한 정보 조회
    }
    else if(req.body.type=="many"){
      DocIDs = req.body.id;
    }
    const docs = await getCategoryQnaDocuments(req.body.type, DocIDs, 12, depth);
    // 결과 반환
    res.status(200).send({docList:docs});
  } catch (error) {
    console.error("Error fetching board data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { handleRenderQnaList };