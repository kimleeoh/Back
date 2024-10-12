import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; // 경로는 환경에 맞게 설정하세요
import { QnaDocuments } from "../../../schemas/docs.js"; // 경로는 환경에 맞게 설정하세요

const qnaBoard = async (req, res) => {

  try {
    if(req.body.type=="one"){
    // commonCategorySchema에서 Rqna_list의 마지막 20개 문서 추출
    const category = await CommonCategory.findOne({"_id":req.body.id[0]})
      .select("Rqna_list")
      .lean();

    if (!category || !category.Rqna_list) {
      return res.status(404).json({ message: "Rqna_list not found" });
    }

    // Rqna_list에서 마지막 20개의 문서 ID 가져오기
    const last20DocIds = category.Rqna_list.slice(-20);
    }
    else if(req.body.type=="many"){
        QnaDocuments.find({'Rcategory':{$in:req.body.id}}).sort({time:-1}).limit(20)
    }
    // 해당 doc_id로 QnaDocuments에서 필요한 정보 조회
    const docs = await QnaDocuments.find({ _id: { $in: last20DocIds } })
      .select("_id title preview_img content name time views like point")
      .lean();

    // 결과 반환
    res.json(docs);
  } catch (error) {
    console.error("Error fetching board data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { testBoard };