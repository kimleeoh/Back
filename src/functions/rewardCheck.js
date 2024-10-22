import { QnaDocuments } from "../schemas/docs.js";
import { User } from "../schemas/user.js";
import { UserDocs } from "../schemas/userRelated.js";
import { Badge } from "../schemas/badge.js";

const rewardNullCheck = async (type, userData, currentDocs) => {
    //userData는 UserDoc 데이터임
    // 1: 글 개수(temporary데이터필요없, Rdoc주소받기), 2: 채택받은 수, 3: 좋아요
    try {
        if (type == 1) {
            if (userData == null) {
                console.error("No document found");
                return { status: false };
            } else if (userData.written == 0) {
                return {
                    status: true,
                    type: "에프킬러에 처음으로 답변을 작성하셨어요!",
                    reward: "50 포인트 증정!",
                    point: 50
                };
            }
        } else {
            if (currentDocs.like == 1 && type == 3) {
                if (userData == null) {
                    console.error("No document found");
                    return { status: false };
                } else if (userData.totalLike == 0) {
                    return {
                        status: true,
                        type: "에프킬러에 처음으로 좋아요를 누르셨어요!",
                        reward: "50 포인트 증정!",
                        point: 50
                    };
                }
                //이 응답받으면 프론트측에서 포인트 업뎃 api요청을 따로 보낼것
            } else if (userData.picked == 0 && type == 2) {
                return {
                    status: true,
                    type: "에프킬러에 처음으로 채택을 받으셨어요!",
                    reward: "100 포인트 증정!",
                    point: 100
                };
            }
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

const rewardOtherCheck = async (type, data, temporarySessionData) => {
    //data에는 userdoc값을 넣어야함
    try {
        if (type == 1) {
            
            if (temporarySessionData.like == 2 && data.totalLike % 10 == 0) {
                return {
                    status: true,
                    type: "누적 좋아요 n개 달성!",
                    reward: "50 포인트 증정!",
                };
                //배지의 경우 : 이 응답받으면 mainInquiry 통해서 가진배지리스트에 추가
                // const badgeId = await Badge.findOne({b_name:"배지이름"})._id;
                // return {status:true, type:"좋아요 업적 달성!", reward:"머머뱃지 증정!", badgeId:badgeId};
            }
        }
        else if(type==3){
            if ( data.written % 10 == 0) {
                return {
                    status: true,
                    type: "답변 업적 달성!",
                    reward: "50 포인트 증정!",
                };
            }
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { rewardNullCheck, rewardOtherCheck };
