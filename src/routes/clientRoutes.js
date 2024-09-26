import express from "express";
import myMiddleware from "../config/jwtManageMiddleware.js";
import { getQnaData, getTipData, getCategory } from "../api/dummy.js";
import {
  handleLogin,
  handleLogout,
  handleKeyRequest,
} from "../api/Auth/loginout.js";
import {
    handleRegister, 
    handleConfirmImgUpload, 
    handleEmailAuthSend, 
    handleEmailAuthCheck
} from "../api/Auth/register.js";
import { handleQnACreate } from "../api/Board/QnA/createPage.js";

const router = express.Router();

router.get("/", (req,res)=>{res.send('<h1>서버 실행 중</h1>');});

// Dummy 관련 라우터
router.get("/dummy/testqna", getQnaData);
router.get("/dummy/testtip", getTipData);
router.get("/dummy/category", getCategory);

// 로그인 관련 라우터
router.post("/login", handleLogin);
router.delete("/logout", handleLogout);
router.post("/login/key", handleKeyRequest);

// 회원가입 관련 라우터
router.post("/register/page/:page", handleRegister);
router.post("/register/email", handleEmailAuthSend);
router.post("/register/emailAuthNum", handleEmailAuthCheck);
router.post("/register/imgUpload", handleConfirmImgUpload);

// QnA 관련 라우터
router.post("/qna/create/post", myMiddleware, handleQnACreate);


export default router;