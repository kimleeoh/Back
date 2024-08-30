import {
  QnaDocuments,
  HoneyDocuments,
  QnaAnswers,
  QnaAlready,
} from "../schemas/docs.js";
import { User } from "../schemas/user.js";

// QnA 데이터 가져오는 로직
export const getQnaData = async (req, res) => {
  try {
    const result = await QnaAlready.findOne();
    console.log(result);

    if (result && result.answer_list.length > 0) {
      const answerData = await QnaAnswers.findById(
        result.answer_list[0].Ranswer,
        { _id: 0, Rqna: 0 }
      ).lean();
      const answerUserData = await User.findById(result.answer_list[0].Ruser, {
        level: 1,
        hakbu: 1,
        name: 1,
        _id: 0,
      }).lean();

      const fin = {
        ...answerData,
        ...answerUserData,
        user_grade: result.answer_list[0].user_grade,
      };

      result.answer_list = [fin];
      console.log(fin);
    }

    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
};

// 팁 데이터 가져오는 로직
export const getTipsData = async (req, res) => {
  try {
    const result = await HoneyDocuments.findOne().lean();
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
};
