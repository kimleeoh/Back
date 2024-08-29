import express from "express";
import { QnaDocuments, QnaAnswers } from "../schemas/docs.js";

const router = express.Router();

/**
 * @swagger
 * /api/question/{questionID}:
 *   get:
 *     summary: 특정 QnA 게시글 및 답변 조회
 *     description: 주어진 questionID에 해당하는 QnA 게시글과 그 답변을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: questionID
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 게시글의 ID
 *     responses:
 *       200:
 *         description: 성공적으로 게시글과 답변을 반환함
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   type: object
 *                   description: 게시글 데이터
 *                 answers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: 답변 데이터
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

// 특정 게시글 및 답변 조회 API (GET 방식)
router.get("/question/:questionID", async (req, res) => {
  try {
    // URL 파라미터에서 questionID 추출
    const { questionID } = req.params;

    // MongoDB에서 게시글 조회 및 조회수 1 증가
    const post = await QnaDocuments.findOneAndUpdate(
      { _id: questionID }, // 요청 받은 questionID로 조회
      { $inc: { views: 1 } }, // 조회수 1 증가
      { new: true } // 업데이트된 데이터 반환
    );

    if (!post) {
      return res.status(404).send("게시글을 찾을 수 없습니다.");
    }

    // 게시글에서 답변 ID 리스트 추출
    const answerIds = post.answer_list.map((answer) => answer.Ranswer);

    // 답변 ID들을 이용하여 답변 데이터 조회
    const answers = await QnaAnswers.find({ _id: { $in: answerIds } });

    // 답변 데이터를 필요한 형식으로 변환
    const formattedAnswers = answers.map((answer) => ({
      QNAcategory: answer.QNAcategory,
      content: answer.content,
      hakbu: answer.hakbu,
      img_list: answer.img_list,
      level: answer.level,
      like: answer.like,
      name: answer.name,
      user_grade: answer.user_grade,
    }));

    // 게시글 데이터와 답변 데이터를 병합하여 프론트엔드에 반환
    const responseData = {
      post,
      answers: formattedAnswers,
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).send("서버 오류");
  }
});

export default router;
