import express from "express";
import { getQnaData, getTipsData } from "../api/dummy.js"; // 비즈니스 로직 함수 가져오기

const router = express.Router();

// QnA 관련 데이터 가져오기
router.get("/qna", getQnaData);

// 팁 관련 데이터 가져오기
router.get("/tip", getTipsData);

export default router;
