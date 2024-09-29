import mongoose from "mongoose";
import { CommonCategory } from "../../../schemas/category.js"; // 경로는 환경에 맞게 설정하세요
import { TestDocuments } from "../../../schemas/docs.js"; // 경로는 환경에 맞게 설정하세요

const testBoard = async (req, res) => {
  try {
    // commonCategorySchema에서 Rtest_list의 마지막 20개 문서 추출
    const category = await CommonCategory.findOne({})
      .select("Rtest_list")
      .lean();

    if (!category || !category.Rtest_list) {
      return res.status(404).json({ message: "Rtest_list not found" });
    }

    // Rtest_list에서 마지막 20개의 문서 ID 가져오기
    const last20DocIds = category.Rtest_list.slice(-20);

    // 해당 doc_id로 TestDocuments에서 필요한 정보 조회
    const docs = await TestDocuments.find({ _id: { $in: last20DocIds } })
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
