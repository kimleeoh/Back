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
import { handleManagePickPage, handleManageUpdatePage } from '../api/Board/QnA/managePage.js'
import { loadBoardPage } from '../api/Board/Board/BoardPage.js'
import { loadBoardDetail } from '../api/Board/Board/BoardDetail.js'
// import { getCachedMyPopularPosts } from '../utils/trendingcheck.js'
import { handleMytrendingList } from '../api/User/Mytrending.js'
import { handleGetScore, handleUploadScore } from '../api/User/score.js'
import { handleHomeDataList } from '../api/Home/Hometrending.js'
import { handleAnswerPossibleList } from "../api/Home/AnswerPossible.js";
import { checkIsUserTips, handlePurchaseTipsPage } from '../api/Board/Tips/managePage.js'
import { handleRenderTipsPage } from "../api/Board/Tips/renderPage.js";
import { handleManageUpdateTipsPage } from '../api/Board/Tips/tipsModify.js'
import { handleDeleteTips } from "../api/Board/Tips/deletePage.js";
import { handlePurchased } from "../api/User/myPurchased.js";
import { handleModal } from "../api/User/modal.js";

const lightRouter = express.Router();
const loginRouter = express.Router();
const heavyRouter = express.Router();
const categoryRouter = express.Router();
//const categoryRouter = express.Router()
const upload = multer({ dest: 'uploads/' }); 

// Dummy 관련 라우터
lightRouter.get('/dummy/testqna', getQnaData);
lightRouter.get('/dummy/testtip', getTipData);

// 카테고리 관련 라우터
categoryRouter.post('/category', getCategory);

// 로그인 관련 라우터
loginRouter.post('/login', handleLogin);
lightRouter.delete('/logout',logoutMiddleware, handleLogout);
loginRouter.post('/login/key', handleKeyRequest);

// 회원가입 관련 라우터
lightRouter.post('/register/page/:page', handleRegister);
lightRouter.post('/register/emailAlready', handleCheckAlreadyEmail);
lightRouter.post('/register/email', handleEmailAuthSend);
lightRouter.post('/register/emailAuthNum', handleEmailAuthCheck);
lightRouter.post('/register/imgUpload', upload.single('img'), handleConfirmImgUpload);

//비번찾기 관련 라우터
lightRouter.post('/findPassword/email', handleFindPassword);
lightRouter.post('/findPassword/emailAuthNum', handleAuthFindPassword);
lightRouter.post('/findPassword/changePassword', handleResetPassword);

// QnA 관련 라우터
lightRouter.post('/qna/create/post', myMiddleware, upload.array('images'),handleQnACreate);
lightRouter.put('/qna/update/post', myMiddleware, handleUpdatePage);
lightRouter.delete('/:category_type/:docid', myMiddleware, handleDeleteQna);
lightRouter.post('/qna/manage/post', myMiddleware, upload.array('images'), handleManageUpdatePage);
lightRouter.put('/qna/manage/pick', myMiddleware, handleManagePickPage);

lightRouter.get('/qna', myMiddleware, handleRenderQnaPage); 

lightRouter.post('/qna/create/answer', myMiddleware, upload.array('images'), handleQnaAnswer);
lightRouter.put('/qna/update/answer', myMiddleware, upload.array('images'),handleEditAnswer);
lightRouter.delete('/qna/delete/answer', myMiddleware, handleEditAnswer);

lightRouter.get('/bulletin/qnas', myMiddleware, handleRenderQnaList);

// tips 관련 라우터
heavyRouter.post('/bulletin/tips', myMiddleware, loadBoardWithFilter) // 게시판 필터링 및 초기 렌더링
lightRouter.post('/tips/create/post', myMiddleware, upload.array('images'), handleTipsCreate); // 게시판 작성
lightRouter.post("/tips/manage", myMiddleware, checkIsUserTips);
lightRouter.post("/tips/purchase", myMiddleware, handlePurchaseTipsPage);
lightRouter.get("/tips/:category_type/:docid", myMiddleware, handleRenderTipsPage);
lightRouter.post("/tips/update", myMiddleware, handleManageUpdateTipsPage);
lightRouter.delete("/tips/:category_type/:docid", myMiddleware, handleDeleteTips);

// 사용자관련
heavyRouter.get('/point', myMiddleware, handlePointRead); // 포인트 조회
lightRouter.get('/notify', myMiddleware, handleNotify); // 알림 조회
lightRouter.post('/notify/check', myMiddleware, handleNotifyCheck); // 알림 확인
heavyRouter.get('/notify/new', myMiddleware, handleNewNotify); // 새로운 알림 확인
lightRouter.post('/notify/unnew', myMiddleware, handleUnNewNotify); // 예전 알림 확인

lightRouter.post('/warn', myMiddleware, handleWarn); // 경고 조회

// board 관련 라우터
lightRouter.post('/board/edit', myMiddleware, handleEditBoard); // 보드편집
lightRouter.get('/board', myMiddleware, loadBoardPage); // 보드메인페이지 조회
lightRouter.post('/board/detail', loadBoardDetail); // 보드과목별 상세페이지 조회

lightRouter.get('/score', myMiddleware, handleGetScore); // 성적가져오기
lightRouter.post('/score', myMiddleware, upload.single('img'), handleUploadScore); // 성적업로드

lightRouter.get('/modal-notify', myMiddleware, handleModal); // 새로운 알림 확인

// 마이페이지 관련 라우터
heavyRouter.get('/mypage/profile', myMiddleware, handleUserProfile); // 마이페이지 기본값 조회
lightRouter.post('/update-profile', myMiddleware, updateUserProfile); // 마이페이지 수정
lightRouter.post('/menu/scraplist', myMiddleware, handleUserScrapList); // 스크랩 리스트 조회
lightRouter.post('/menu/likelist', myMiddleware, handleUserLikeList); // 좋아요 리스트 조회
lightRouter.post('/menu/postlist', myMiddleware, handleUserPostList); // 내가 쓴 글 리스트 조회
lightRouter.get("/menu/recentlist", myMiddleware, handleRecentRead); // 최근 본 글 리스트 조회
lightRouter.post("/menu/purchased", myMiddleware, handlePurchased);

// 인기 게시물 조회 관련
heavyRouter.post("/mypage/trending", myMiddleware, handleMytrendingList); // 프로필페이지의 인기게시글 조회

// 홈 화면 관련 라우터
// 인기 게시물 조회 관련
heavyRouter.post("/home/trending", myMiddleware, handleHomeDataList); // 홈 게시판별 인기 tips조회
heavyRouter.post("/home/answer-possible", myMiddleware, handleAnswerPossibleList); // 홈 게시판별 인기 qna조회

// // 캐시 테스트
// router.get('/cache/popular-posts', getCachedPopularPosts);

export {lightRouter, loginRouter, heavyRouter, categoryRouter};