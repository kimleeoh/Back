import { QnaDocuments } from "../schemas/docs.js";
import { User } from "../schemas/user.js";
import { notify } from "../config/notifier.js";
import { UserDocs } from "../schemas/userRelated.js";

const rewardNullCheck = async (type, userData, temporarySessionData) => {
  //userData는 mainInquiry값
  // 1: 글 개수(temporary데이터필요없, Rdoc주소받기), 2: 채택받은 수, 3: 좋아요
  if (type == 1) {
    const doc = await UserDocs.findOne({ _id: userData.Rdoc });
    if (doc == null) {
      console.error("No document found");
      return { status: false };
    } else if (doc.written == 0) {
      return {
        status: true,
        type: "에프킬러에 처음으로 글을 작성하셨어요!",
        reward: "50 포인트 증정!",
      };
    }
  } else {
    if (temporarySessionData.joayo == 2 && type == 3) {
      const doc = await UserDocs.findOne({ _id: userData.Rdoc });
      if (doc == null) {
        console.error("No document found");
        return { status: false };
      } else if (doc.totalLike == 1) {
        return {
          status: true,
          type: "에프킬러에 처음으로 좋아요를 누르셨어요!",
          reward: "50 포인트 증정!",
        };
      }
      //이 응답받으면 프론트측에서 포인트 업뎃 api요청을 따로 보낼것
    } else if (userData.picked == 0 && type == 2) {
      return {
        status: true,
        type: "에프킬러에 처음으로 채택을 받으셨어요!",
        reward: "100 포인트 증정!",
      };
    }
  }
  try {
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
};

const rewardOtherCheck = async (type, data, temporarySessionData) => {
  try {
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
};

export { rewardNullCheck, rewardOtherCheck };
