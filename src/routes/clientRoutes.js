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
import { handleNewNotify, handleNotify, handleNotifyCheck, handleUnNewNotify } from '../api/Board/Common/notify.js'
import { handleUserScrapList } from '../api/User/myScrap.js'
import { handleUserLikeList } from "../api/User/myLike.js";
import { handleUserPostList } from "../api/User/myDocs.js";
import { handleRenderQnaList } from '../api/Board/QnA/renderList.js'
import { handleRecentRead } from '../api/User/recentVisits.js'
import { handleEditBoard } from '../api/Board/Board/editBoard.js'
import { handleUpdatePage } from '../api/Board/QnA/updatePage.js'
import { handleEditAnswer, handleQnaAnswer } from '../api/Board/QnA/answer.js'
import { handleDeleteQna } from '../api/Board/QnA/deletePage.js'
import { handleIsManage, handleManagePickPage, handleManageUpdatePage } from '../api/Board/QnA/managePage.js'
import { loadBoardPage } from '../api/Board/Board/BoardPage.js'
import { loadBoardDetail } from '../api/Board/Board/BoardDetail.js'
import { handleMytrendingList } from '../api/Board/Common/Mytrending.js'
// import { getCachedPopularPosts } from '../utils/trendingcheck.js'
import { handleGetScore, handleUploadScore } from '../api/User/score.js'

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
router.put('/qna/update/post', myMiddleware, handleUpdatePage);
router.delete('/qna/delete/post', myMiddleware, handleDeleteQna);
router.post('/qna/manage/post', myMiddleware, upload.array('images'), handleManageUpdatePage);
router.put('/qna/manage/pick', myMiddleware, handleManagePickPage);
router.get('/qna/manage', myMiddleware, handleIsManage);

router.get('/qna/post', myMiddleware, handleRenderQnaPage); 

router.post('/qna/create/answer', myMiddleware, upload.array('images'), handleQnaAnswer);
router.put('/qna/update/answer', myMiddleware, upload.array('images'),handleEditAnswer);
router.delete('/qna/delete/answer', myMiddleware, handleEditAnswer);

router.get('/bulletin/qnas', myMiddleware, handleRenderQnaList);

// tips 관련 라우터
router.post('/bulletin/tips', myMiddleware, loadBoardWithFilter) // 게시판 필터링 및 초기 렌더링
router.post('/tips/create/post', myMiddleware, upload.array('images'), handleTipsCreate) // 게시판 작성


router.get('/point', myMiddleware, handlePointRead); // 포인트 조회
router.get('/notify', myMiddleware, handleNotify); // 알림 조회
router.post('/notify/check', myMiddleware, handleNotifyCheck); // 알림 확인
router.get('/notify/new', myMiddleware, handleNewNotify); // 새로운 알림 확인
router.post('/notify/unnew', myMiddleware, handleUnNewNotify); // 예전 알림 확인
router.post('/warn', myMiddleware, handleWarn); // 경고 조회

// board 관련 라우터
router.post('/board/edit', myMiddleware, handleEditBoard); // 보드편집
router.get('/board', myMiddleware, loadBoardPage); // 보드메인페이지 조회
router.post('/board/detail', loadBoardDetail); // 보드과목별 상세페이지 조회

router.get('/score', myMiddleware, handleGetScore); // 성적가져오기
router.post('/score', myMiddleware, upload.single('img'),handleUploadScore); // 성적업로드

// 마이페이지 관련 라우터
router.get('/mypage/profile', myMiddleware, handleUserProfile); // 마이페이지 기본값 조회
router.post('/update-profile', myMiddleware, updateUserProfile); // 마이페이지 수정
router.post('/menu/scraplist', myMiddleware, handleUserScrapList); // 스크랩 리스트 조회
router.post('/menu/likelist', myMiddleware, handleUserLikeList); // 좋아요 리스트 조회
router.post('/menu/postlist', myMiddleware, handleUserPostList); // 내가 쓴 글 리스트 조회
router.get("/menu/recentlist", myMiddleware, handleRecentRead); // 최근 본 글 리스트 조회

// 인기 게시물 조회 관련
router.get("/mypage/trending", myMiddleware, handleMytrendingList); // 프로필페이지의 인기게시글 조회



// 캐시 테스트
// router.get('/cache/popular-posts', getCachedPopularPosts);

export default router;