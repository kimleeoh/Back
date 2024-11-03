import { QnaDocuments } from "../schemas/docs.js";
import { User } from "../schemas/user.js";
import { UserDocs } from "../schemas/userRelated.js";
import { Badge } from "../schemas/badge.js";


// [ '척척박사', new ObjectId('67239238295ec9562088e9e0') ],
//   [ '데일리 출석왕', new ObjectId('67239238295ec9562088e9e1') ],
//   [ '채택왕', new ObjectId('67239238295ec9562088e9e2') ],
//   [ '슈퍼스타', new ObjectId('67239238295ec9562088e9e3') ],
//   [ '모두의 선생님', new ObjectId('67239238295ec9562088e9e4') ],
//   [ '수집가', new ObjectId('67239238295ec9562088e9e5') ],
//   [ '열혈수강생', new ObjectId('67239238295ec9562088e9e6') ],
//   [ '억만장자', new ObjectId('67239238295ec9562088e9e7') ],
//   [ '장학생', new ObjectId('67239238295ec9562088e9e8') ]

//전문가 링크https://d1bp3kp7g4awpu.cloudfront.net/badge/0.svg
//["내가 쓴 답변의 채택 수 5개 돌파!", 
//"출석 5일 연속 돌파!", 
//"내가 채택한 답변 10개 돌파!", 
//"내가 쓴 답변의 좋아요 수 20개 돌파!", 
//"내가 쓴 꿀팁의 다운로드 수 10개 돌파!", 
//"내가 스크랩한 게시글 20개 돌파!", 
//"내가 작성한 질문 20개 돌파!", 
//"내가 구매한 꿀팁 글 10개 돌파!", 
//"평균학점이..4점 이상..!"];
const rewardNullCheck = async (type, userData, currentDocs) => {
    //userData는 UserDoc 데이터임
    // 0:회원가입, 1: 글 개수(temporary데이터필요없, Rdoc주소받기), 2: 채택받은 수, 3: 좋아요
    try {
        switch (type) {
            case 0:
                if (userData == null) {
                    console.error("No document found");
                    return { status: false };
                } else if (userData.confirmed == 2) {
                    return {
                        status: true,
                        type: "에프킬러 회원이 되신 것을 축하드려요!",
                        reward: "기념으로 500포인트를 드리니 잘 활용하시길 바라요!",
                        point: 500,
                    };
                }
                break;
            case 1:
                if (userData == null) {
                    console.error("No document found");
                    return { status: false };
                } else if (userData.written == 0) {
                    return {
                        status: true,
                        type: "에프킬러에 처음으로 글을 작성하셨어요!\n앞으로도 많은 글을 작성해서 경험치를 쌓아보세요!",
                        reward: "200 포인트 증정!",
                        point: 200,
                    };
                }
                break;
            case 2:
                if (userData.picked == 0) {
                    return {
                        status: true,
                        type: "에프킬러에 처음으로 채택을 받으셨어요!\n앞으로도 영양가있는 답변을 작성하여 포인트를 받아보세요!",
                        reward: "500 포인트 증정!",
                        point: 500,
                    };
                }
                break;
            case 3:
                if (Number(currentDocs.like)>0&&userData.totalLike == 0) {
                    return {
                        status: true,
                        type: "에프킬러에 처음으로 좋아요를 누르셨어요!\n앞으로도 좋아요를 많이 눌러 경험치를 쌓아보세요!",
                        reward: "200 포인트 증정!",
                        point: 200,
                    };
                }
                break;
            case 4:
                const wasNone = userData.semester_list.reduce((acc, cur) => {
                    if (cur.filled) {
                    acc += 1;
                    }
                return acc;},0);
                if (wasNone == 0) {
                    return {
                        status: true,
                        type: "에프킬러에 처음으로 성적을 입력하셨어요!\n다른 성적들도 입력해보세요!",
                        reward: "500 포인트 증정!",
                        point: 500,
                    };
                }
                break;
            case 5:
                for(const val of Object.values(userData)){
                    userData[val].length>0
                }
        }
        return { status: false };
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
                    type: "좋아요를 10개 더 누르셨네요!",
                    reward: "100 포인트 증정!",
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
                    type: "답변을 10개 더 다셨네요!",
                    reward: "100 포인트 증정!",
                };
            }
        }
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { rewardNullCheck, rewardOtherCheck };
