import express from "express";
import { getQnaData, getTipData } from "../api/dummy.js";
import {
  handleLogin,
  handleLogout,
  handleKeyRequest,
} from "../api/Auth/loginout.js";
import {
  handleRegister,
  handleEmail,
  handleEmailAuthNum,
} from "../api/Auth/register.js";

const router = express.Router();

// Dummy 관련 라우터
router.get("/dummy/testqna", getQnaData);
router.get("/dummy/testtip", getTipData);

// 로그인 관련 라우터
router.post("/login", handleLogin);
router.delete("/logout", handleLogout);
router.post("/login/key", handleKeyRequest);

// 회원가입 관련 라우터
router.post("/register/page/:page", handleRegister);
router.post("/register/email", handleEmail);
router.post("/register/emailAuthNum", handleEmailAuthNum);

// qna 관련 라우터
router.get("/qna/{questionID}", handleRegister);
router.get("/qna", handleEmail);
router.post("/qna/create/post", handleEmailAuthNum);
router.post("/qna/update", handleEmailAuthNum);
router.post("/qna/create/answer", handleEmailAuthNum);
router.post("/qna/modify", handleEmailAuthNum);
router.put("/qna/manage", handleEmailAuthNum);

// tips 관련 라우터
router.post("/treding/modify", handleEmailAuthNum);
// user 관련 라우터

// common 관련 라우터

// 과목 선택 관련 라우터

export default router;
