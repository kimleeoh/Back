import { User } from "../schemas/user.js";
import { Notify } from "../schemas/notify.js";
import smtpTransport from "../config/emailHandler.js";
import mongoose from "mongoose";
import mainInquiry from "./mainInquiry.js";

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
10: 알림설정눌러놓은 게시글에 답변달림
11: 알림설정눌러놓은 게시글이 채택됨
12: 내 답변 채택됨
... 
*/

const othersMessageList = [
    "을 수정했어요!",
    "에 답변을 달았어요!",
    "의 답변을 채택했어요!",
    "의 내 답변을 채택했어요!"
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
        Author:async(docAuthorId, docId, docTitle,senderName, typeNum, docPoint=0) => {  
            try{
                const ID = new mongoose.Types.ObjectId();
                const authorNotify = await User.findById(docAuthorId);
                authorNotify.newNotify = true;
                

                let poin = 0;

                if(2<typeNum && typeNum<6){
                    const index = authorNotify.notify_meta_list.findIndex((obj)=>obj.Type==typeNum&&obj.Sender==senderName);
                    const thatObj = index==-1? undefined : authorNotify.Rnotify_list[index];
                    const that = await Notify.findById(thatObj);
                    if(thatObj!=undefined && that.time - authorTimestamp < 300000){
                        that.count++;
                        that.time = authorTimestamp;
                        await that.save();
                        console.log('이미 알림이 있습니다.');
                        return {state: true, message:"updated"};
                    }
                    else{
                        if(typeNum==6)poin = 50;
                        authorTimestamp = Date.now();
                        await Notify.create({
                            _id : ID,
                            types: typeNum,
                            who_user: senderName,
                            time: authorTimestamp,
                            Rdoc : docId,
                            Rdoc_title : docTitle,
                            count: 1, // Initialize count
                            checked:false,
                            point:poin
                        });

                        authorNotify.notify_meta_list.push({Type:typeNum, Sender:senderName});
                        authorNotify.Rnotify_list.push(ID);

                        await authorNotify.save();
                        return {state: true, message:"created"};
                    }
                }else{
                    authorTimestamp = Date.now();
                    if(typeNum<3){
                        await notiMailer(authorNotify.email, typeNum==2, docId, docTitle, senderName);
                    }else if(typeNum==12){
                        await notiMailer(authorNotify.email, 3, docId, docTitle, senderName);
                        poin = docPoint;
                    }
                    await Notify.create({
                        _id:ID,
                        types: typeNum,
                        who_user: senderName,
                        time: authorTimestamp,
                        Rdoc : docId,
                        Rdoc_title : docTitle,
                        count: 1, // Initialize count
                        checked:false,
                        point:poin
                    });

                    authorNotify.notify_meta_list.push({Type:typeNum, Sender:senderName});
                    authorNotify.Rnotify_list.push(ID);

                    await authorNotify.save();
                    return {state: true, message:"created"};
                }
            }catch(e){
                console.log(e);
                return {state: false, message:"error"};
            }
        },
        Follower:async (Rnotifyusers_list, docId, docTitle, senderName, typeNum) => {
            try{
                const getResult = await User.find({ _id: { $in: Rnotifyusers_list } });
                for(const user of getResult){
                    const ID = new mongoose.Types.ObjectId();
                    const updateData = {
                        id:ID,
                        types: typeNum,
                        who_user: senderName,
                        time: Date.now(),
                        Rdoc : docId,
                        Rdoc_title : docTitle,
                        checked:false,
                        point:0,
                        count: 1 // Initialize count
                    };
                    user.newNotify = true;
                    user.Rnotify_list.push(ID);
                    user.notify_meta_list.push({Type:typeNum, Sender:senderName});
                    await user.save();
                    if(typeNum==11) await notiMailer(user.email, 2, docId, docTitle, senderName);
                    
                }
            
                return {state: true, message:"created"};
            }catch(e){
                console.log(e);
                return {state: false, message:"error"};
            }
        },
        Self:async (selfId, docId, docTitle, typeNum) => {
            //뱃지 획득을 알림창에 띄워두는거
            try{let poin = 0;
            if(typeNum==8)poin = 100;
            else if(typeNum==7)poin = 50;

            const ID = new mongoose.Types.ObjectId();
            await Notify.create({
                _id:ID,
                types: typeNum,
                who_user: "system",
                time: Date.now(),
                Rdoc : docId,
                Rdoc_title : docTitle,
                checked:false,
                point:poin,
                count: 1 // Initialize count
            });

            await mainInquiry.write({Rnotify_list:ID, notify_meta_list:{Type:typeNum, Sender:senderName}}, selfId);
            return {state: true, message:"created"};
        }
            catch(e){
                console.log(e);
                return {state: false, message:"error"};
            }

        }
    }
})();

export {notify};