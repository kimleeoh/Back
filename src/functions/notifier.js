import { User } from "../schemas/user.js";
import { Notify } from "../schemas/notify.js";
import smtpTransport from "../config/emailHandler.js";

/*
1: 알림설정 눌러놓은 게시글 수정되면 알림
2: 내 질문에 답변달림 
3: 내 답변이나 질문에 좋아요 눌림
4: 내 답변이나 질문에 스크랩 눌림
5: 포인트관련 소비 (파일구매)
6: 포인트 관련 획득(남이 눌러준누적좋아요 10개단위마다, 누적스크랩 10개단위마다..등등)
7: 포인트 관련 획득(내가 누른 누적좋아요 10개단위마다, 누적스크랩 10개단위마다..등등)
8: 배지 획득
9: 게시물이 신고처리됨
... 
*/

const othersMessageList = [
    "을 수정했어요!",
    "에 답변을 달았어요!",
];

const totalFormat = (type)=> [
    `<h1>${senderName}님이 글 ${docTitle}${othersMessageList[type]}</h1><br></br><input type="button" value="확인하러 가기" onclick="window.open('https://localhost:3000/qna/${docId}', '_blank')">`
];

async function notiMailer(userEmail, isAnswerType, docId, docTitle, senderName){
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: " [A-F Killer] 새로운 알림이 도착했습니다.",
        html: totalFormat(isAnswerType)
    };

    try{
        await smtpTransport.sendMail(mailOptions);
        smtpTransport.close();
        return {status:true, message : "mail sent"};
    }
    catch(err){
        smtpTransport.close();
        return {status:false, message : err};
    }
}


const notify = (() => {
    let authorTimestamp = Date.now();

    //몇 분 내로 보낸 좋아요 알림은 무시하게 코드짜기
    //timer fire
    return {
        Author:async(docAuthorId, docId, docTitle,senderName, typeNum) => {  
            try{
                //notify 호출 이전에 client session에 저장된 작성자의 id와 mainInquiry를 통해 알람 생성자의 name을 가져와야함
                const authorNotify = await User.findById(docAuthorId).Rnotify;
                const noti = await Notify.findById(authorNotify);

                if(2<typeNum && typeNum<6){
                    const index = noti.Notifys_list.findIndex((obj)=>obj.types==typeNum&&obj.who_user==senderName);
                    const thatObj = index==-1? undefined : noti.Notifys_list[index];
                    
                    if(thatObj!=undefined && thatObj.time - authorTimestamp < 300000){
                        thatObj.count++;
                        await noti.save();
                        console.log('이미 알림이 있습니다.');
                        return {state: true, message:"updated"};
                    }
                    else{
                        authorTimestamp = Date.now();
                        noti.Notifys_list.push({
                            types: typeNum,
                            who_user: senderName,
                            time: authorTimestamp,
                            Rdoc : docId,
                            Rdoc_title : docTitle,
                            count: 1 // Initialize count
                        });
                        await noti.save();
                        return {state: true, message:"created"};
                    }
                }else{
                    authorTimestamp = Date.now();
                    if(typeNum<3){
                        await notiMailer(noti.email, typeNum==2, docId, docTitle, senderName);
                    }
                    noti.Notifys_list.push({
                        types: typeNum,
                        who_user: senderName,
                        time: authorTimestamp,
                        Rdoc : docId,
                        Rdoc_title : docTitle,
                        count: 1 // Initialize count
                    });
                    await noti.save();
                    return {state: true, message:"created"};
                }
            }catch(e){
                console.log(e);
                return {state: false, message:"error"};
            }
        },
        Follower:async (Rnotifyusers_list, docId, docTitle, senderName, typeNum) => {
            try{
                const updateData = {
                    Notifys_list: {
                        types: typeNum,
                        who_user: senderName,
                        time: Date.now(),
                        Rdoc : docId,
                        Rdoc_title : docTitle,
                        count: 1 // Initialize count
                    }
                };

                const getResult = await User.find({ _id: { $in: Rnotifyusers_list } });
                const RnotifyArray = getResult.map(user => user.Rnotify); // Extract Rnotify values
                const result = await Notify.updateMany(
                    { _id: { $in: RnotifyArray } }, // Filter to match user IDs
                    { $push: updateData } // Update operation
                );
                console.log(result);
                return {state: true, message:"created"};
            }catch(e){
                console.log(e);
                return {state: false, message:"error"};
            }
        },
        Self:async (selfId, docId, docTitle, typeNum) => {
            //뱃지 획득을 알림창에 띄워두는거
            const updateData = {
                Notifys_list: {
                    types: typeNum,
                    who_user: "system",
                    time: Date.now(),
                    Rdoc : docId,
                    Rdoc_title : docTitle,
                    count: 1 // Initialize count
                }
            };

            try{
                const userNotify = await User.findById(selfId).Rnotify;
                const noti = await Notify.updateOne({_id:userNotify}, {$push: updateData});
                console.log(noti);
            }catch(e){
                console.log(e);
                return {state: false, message:"error"};
            }
        }
    }
})();

export {notify};