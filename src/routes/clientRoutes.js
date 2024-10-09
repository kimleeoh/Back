import express from 'express'
import multer from 'multer'
import {myMiddleware, logoutMiddleware} from '../config/jwtManageMiddleware.js'
import { getQnaData, getTipData, getCategory } from '../api/dummy.js'
import {
  handleLogin,
  handleLogout,
  handleKeyRequest,
} from '../api/Auth/loginout.js'
import {
  handleRegister,
  handleConfirmImgUpload,
  handleEmailAuthSend,
  handleEmailAuthCheck,
  handleFindPassword,
  handleAuthFindPassword,
  handleResetPassword,
  handleCheckAlreadyEmail
} from '../api/Auth/register.js'
import { handleQnACreate } from '../api/Board/QnA/createPage.js'
import { loadBoardWithFilter } from '../api/Board/Tips/renderList.js'
import { handlePointRead } from '../api/User/point.js'
// import { handleTipCreate } from "../api/Board/Tips/createPage.js";
// import { handleUserProfile, updateUserProfile } from '../api/User/myPage.js'
const router = express.Router()
const upload = multer({ dest: 'uploads/' }); 

// Dummy 관련 라우터
router.get('/dummy/testqna', getQnaData)
router.get('/dummy/testtip', getTipData)
router.post('/dummy/category', getCategory)

// 로그인 관련 라우터
router.post('/login', handleLogin)
router.delete('/logout',logoutMiddleware, handleLogout)
router.post('/login/key', handleKeyRequest)

// 회원가입 관련 라우터
router.post('/register/page/:page', handleRegister)
router.post('/register/emailAlready', handleCheckAlreadyEmail)
router.post('/register/email', handleEmailAuthSend)
router.post('/register/emailAuthNum', handleEmailAuthCheck)
router.post('/register/imgUpload', upload.single('img'), handleConfirmImgUpload)

//비번찾기 관련 라우터
router.post('/findPassword/email', handleFindPassword)
router.post('/findPassword/emailAuthNum', handleAuthFindPassword)
router.post('/findPassword/changePassword', handleResetPassword)

// QnA 관련 라우터
router.post('/qna/create/post', myMiddleware, handleQnACreate)

// tips 관련 라우터
router.post('/bulletin/tips', loadBoardWithFilter) // 게시판 필터링 및 초기 렌더링

// 포인트 관련 라우터
router.get('/point', myMiddleware, handlePointRead); // 포인트 조회

// router.post('/add-article', handleTipCreate) // 게시판 작성

// // 마이페이지 관련 라우터
// router.get('/mypage', myMiddleware, handleUserProfile)
// router.post('/update-profile', updateUserProfile)


export default router
