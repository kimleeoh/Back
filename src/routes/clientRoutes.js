import express from 'express'
import multer from 'multer'
import {myMiddleware, logoutMiddleware} from '../config/jwtManageMiddleware.js'
import { getQnaData, getTipData } from '../api/dummy.js'
import { getCategory } from '../api/Category/selectCategory.js'
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
import { handleRenderQnaPage } from '../api/Board/QnA/renderPage.js'
import { loadBoardWithFilter } from '../api/Board/Tips/renderList.js'
import { handlePointRead } from '../api/User/point.js'
import { handleTipsCreate } from "../api/Board/Tips/createPage.js";
import { handleUserProfile, updateUserProfile } from '../api/User/myPage.js'
import { handleWarn } from '../api/Board/Common/warn.js'
import { handleNewNotify, handleNotify, handleNotifyCheck } from '../api/Board/Common/notify.js'
import { handleUserScrapList } from '../api/User/myScrap.js'
import { handleUserLikeList } from "../api/User/myLike.js";
import { handleUserPostList } from "../api/User/myDocs.js";
import { handleRenderQnaList } from '../api/Board/QnA/renderList.js'
import { handleRecentRead } from '../api/User/recentVisits.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' }); 

// Dummy 관련 라우터
router.get('/dummy/testqna', getQnaData)
router.get('/dummy/testtip', getTipData)

// 카테고리 관련 라우터
router.post('/category', getCategory)

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
router.post('/qna/create/post', myMiddleware, upload.array('images'),handleQnACreate)
router.get('/qna/page', myMiddleware, handleRenderQnaPage); 
router.get('/bulletin/qnas', myMiddleware, handleRenderQnaList);

// tips 관련 라우터
router.post('/bulletin/tips', myMiddleware, loadBoardWithFilter) // 게시판 필터링 및 초기 렌더링
router.post('/tips/create/post', myMiddleware, upload.array('images'), handleTipsCreate) // 게시판 작성

router.get('/point', myMiddleware, handlePointRead); // 포인트 조회
router.get('/notify', myMiddleware, handleNotify); // 알림 조회
router.post('/notify/check', myMiddleware, handleNotifyCheck); // 알림 조회
router.get('/notify/new', myMiddleware, handleNewNotify); // 알림 확인
router.post('/warn', myMiddleware, handleWarn); // 경고 조회


// 마이페이지 관련 라우터
router.get('/mypage/profile', myMiddleware, handleUserProfile); // 마이페이지 기본값 조회
router.post('/update-profile', myMiddleware, updateUserProfile); // 마이페이지 수정
router.post('/menu/scraplist', myMiddleware, handleUserScrapList); // 스크랩 리스트 조회
router.post('/menu/likelist', myMiddleware, handleUserLikeList); // 좋아요 리스트 조회
router.post('/menu/postlist', myMiddleware, handleUserPostList); // 내가 쓴 글 리스트 조회
router.get("/menu/recentlist", myMiddleware, handleRecentRead); // 내가 쓴 글 리스트 조회

export default router
