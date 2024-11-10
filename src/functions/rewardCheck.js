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
//User를 [false, false, false, false, false, false]로 초기화
const rewardNullCheck = async (type, userData, currentDocs, uNullList) => {
    //userData는 UserDoc 데이터임
    // 0:회원가입, 1: 글 개수(temporary데이터필요없, Rdoc주소받기), 2: 채택받은 수, 3: 좋아요
    try {
        if(uNullList[type]){return {status:false};}
        switch (type) {
            case 0:  
                return {
                    status: true,
                    type: "에프킬러 회원이 되신 것을 축하드려요!",
                    reward: "기념으로 500포인트를 드리니 잘 활용하시길 바라요!",
                    point: 500,
                    uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                };
                
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
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
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
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
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
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
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
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                    };
                }
                break;
            case 5:
                if(userData==10){
                    return{
                        status:true,
                        type:"내 관심 게시판을 10개 등록하셨네요!",
                        reward:"500 포인트 증정!",
                        point:500,
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                    };
                }
                break;
            case 6:
                if(userData.Rpurchased_list.length==0){
                    return {status:true,
                        type:"에프킬러에 처음으로 꿀팁을 구매하셨네요!",
                        reward:"매 구입마다 10 포인트를 돌려드리니, 많은 이용 부탁드립니다!",
                        point:0,
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                    };
                }
                break;
            case 7:
                if(userData.picked == 5){
                    const bdg = await Badge.findOne({b_name:"척척박사"}).lean();
                    return {status:true,
                        type:"척척박사 배지 획득!",
                        reward:bdg.b_img,
                        point:0,
                        bid:bdg._id,
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                    };
                }
                break;
            case 8:
                if(userData.attendance == 5){
                    const bdg = await Badge.findOne({b_name:"데일리 출석왕"}).lean();
                    return {status:true,
                        type:"데일리 출석왕 배지 획득!",
                        reward:bdg.b_img,
                        point:0,
                        bid:bdg._id,
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                    };
                }
                break;
            case 9:
                if(userData.Ipicked == 10){
                    const bdg = await Badge.findOne({b_name:"채택왕"}).lean();
                    return {status:true,
                        type:"채택왕 배지 획득!",
                        reward:bdg.b_img,
                        point:0,
                        bid:bdg._id,
                        uNullList:uNullList.map((val, idx)=>{if(idx==type){return true;}else{return val;}})
                    };
                }
                break;
        }
        return { status: false };
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

const rewardOtherCheck = async (type, data, temporarySessionData, count) => {
    //data에는 userdoc값을 넣어야함
    try {
        if (type == 1) {
            
            if (temporarySessionData.like>0 && data.totalLike % 10 == 0&& count+1 == data.totalLike/10) {
                return [{
                    status: true,
                    type: "좋아요를 10개 더 누르셨네요!",
                    reward: "100 포인트 증정!",
                    point: 100
                }];
                //배지의 경우 : 이 응답받으면 mainInquiry 통해서 가진배지리스트에 추가
                // const badgeId = await Badge.findOne({b_name:"배지이름"})._id;
                // return {status:true, type:"좋아요 업적 달성!", reward:"머머뱃지 증정!", badgeId:badgeId};
            }
        }else if(type==2){
            if ( temporarySessionData.scrap>0) {
                const totalScrap = Object.values(data.RmyScrap_list).reduce((acc, cur) => {
                    acc += data.RmyScrap_list[cur].length;
                }, 0);
                if(totalScrap % 10 == 0&& count+1 == totalScrap/10){
                    const r = [{
                        status: true,
                        type: "스크랩을 10개 더 하셨네요!",
                        reward: "100 포인트 증정!",
                        point: 100
                    }];
                    if(totalScrap==20){
                        const bdg = await Badge.findOne({b_name:"수집가"}).lean();
                        r.append({
                            status: true,
                            type: "수집가 배지 획득!",
                            reward: bdg.b_img,
                            bid:bdg._id
                        });
                    }
                    return r;
                }
            }
        }
        else if(type==3){
            if(data.Rreply_category_map[temporarySessionData[0]]==5){
                let bdg = await Badge.findOne({b_name:`${temporarySessionData[1]} 전문가`}).lean();
                if(bdg==null){
                    const ID = new mongoose.Types.ObjectId();
                    Badge.create({
                        _id:ID,
                        b_name:`${temporarySessionData[1]} 전문가`,
                        b_img:"https://d1bp3kp7g4awpu.cloudfront.net/badge/0.svg",
                        b_explain:`내가 작성한 ${temporarySessionData[1]}에 대한 답변 5개 돌파!`
                    });
                    bdg = {_id:ID, b_img:"https://d1bp3kp7g4awpu.cloudfront.net/badge/0.svg"};
                }
                return [{
                    status: true,
                    type: "전문가 배지 획득!",
                    reward: bdg.b_img,
                    point: 0,
                    bid: bdg._id
                }];
            }else{
                if ( data.Rreply_list.length>0&&data.Rreply_list.length % 10 == 0&& count+1 == data.Rreply_list.length/10) {
                    return [{
                        status: true,
                        type: "답변을 10개 더 다셨네요!",
                        reward: "100 포인트 증정!",
                        point: 100
                    }];
                }
            }
        }else if(type==4){
            if(data.Rpurchased_list.length==10 && count+1 == 1){
                const bdg = await Badge.findOne({b_name:"억만장자"}).lean();
                return [{
                    status:true,
                    type:"억만장자 배지 획득!",
                    reward:bdg.b_img,
                    point:0,
                    bid:bdg._id,
                }];
            }        
        }else if(type==5){
            if(data.Rqna_list.length==20 && count+1 == 1){
                const bdg = await Badge.findOne({b_name:"장학생"}).lean();
                return [{
                    status:true,
                    type:"장학생 배지 획득!",
                    reward:bdg.b_img,
                    point:0,
                    bid:bdg._id,
                }];
            }
        }
        return { status: false};
    } catch (e) {
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
};

export { rewardNullCheck, rewardOtherCheck };
