import express from "express";
import { getQnaData, getTipData } from "../api/dummy.js";
import {
  handleLogin,
  handleLogout,
  handleKeyRequest,
} from "../api/loginout.js";
import {
  handleRegister,
  handleEmail,
  handleEmailAuthNum,
} from "../api/register.js";

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

export default router;
