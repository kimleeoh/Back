import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; // 경로는 환경에 맞게 설정하세요
import { QnaDocuments } from "../../../schemas/docs.js"; // 경로는 환경에 맞게 설정하세요
import { getCategoryQnaDocuments } from "../../../functions/documentHelpers.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import redisHandler from "../../../config/redisHandler.js";

const handleRenderQnaList = async (req, res) => {
//{type:"one"/"many", depth:1, id:[category_id]} 형식으로 요청

  const depth = req.query.depth || 1;
  try {
    let DocIDs;
    if(req.query.type=="one"){
        // commonCategorySchema에서 Rqna_list의 마지막 20개 문서 추출
        const category = await CommonCategory.findOne({ _id: req.query.id[0] })
            .select("Rqna_list")
            .lean();

        // category가 비어있으면 200 상태 코드와 "uniquecategory is null" 메시지 반환
        if (!category) {
            return res.status(200).json({ message: "uniquecategory is null" });
        }

        // category는 존재하지만 Rqna_list가 비어있으면 200 상태 코드와 "qnalist is null" 메시지 반환
        if (!category.Rqna_list || category.Rqna_list.length === 0) {
            return res.status(200).json({ message: "qnalist is null" });
        }

        const end = -12 * (depth - 1) || undefined;
        const start = end == undefined ? -12 : end - 12;

        // Rqna_list에서 마지막 20개의 문서 ID 가져오기
        DocIDs = category.Rqna_list.slice(start, end);
        // 해당 doc_id로 QnaDocuments에서 필요한 정보 조회
    }
    else if(req.query.type=="many"){
      if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
      }
      const result = await mainInquiry.read(['Renrolled_list', 'Rbookmark_list', 'Rlistened_list'], req.decryptedSessionId);
      const lst = [ ...result.Renrolled_list, ...result.Rbookmark_list, ...result.Rlistened_list ];
      DocIDs = [...new Set(lst)];
      console.log("DOC:",DocIDs);

    }
    const docs = await getCategoryQnaDocuments(req.query.type, DocIDs, req.query.isAGradeOnly, 12, depth);
    // 결과 반환
    res.status(200).send({docList:docs});
  } catch (error) {
    console.error("Error fetching board data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { handleRenderQnaList };