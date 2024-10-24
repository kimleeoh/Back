import mainInquiry from '../../../functions/mainInquiry.js';
import { notify } from '../../../functions/notifier.js';
import { rewardNullCheck, rewardOtherCheck } from '../../../functions/rewardCheck.js';
import {QnaDocuments, QnaAnswers} from '../../../schemas/docs.js';
import { UserDocs } from '../../../schemas/userRelated.js';
import redisHandler from '../../../config/redisHandler.js';

const handleUpdatePage = async (req, res) => {

    const {id, currentDocs} = req.body;

    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const received = await mainInquiry.read(['_id','Rdoc'],req.decryptedSessionId);
    const userDoc = await UserDocs.findById(received.Rdoc);
    const doc = await QnaDocuments.findById(id);
    let checkMiddleInvalid = false;

    const willchange = currentDocs;

    doc.views += 1;
    const RanswerList = doc.answer_list.map(answer => answer.Ranswer.toString());
    
    if(RanswerList.length!==0) {
    const answers = await QnaAnswers.find({_id:{$in:RanswerList}});

    console.log(willchange);
   
    if(willchange.answer_like_list!="" || willchange.answer_like_list.length!=0){
        let wa = willchange.answer_like_list.split(',');
        console.log("좋아요목록", willchange.isAnswerLiked);
        
        wa = wa.map(Number);
        console.log("대상목록", wa);
        console.log("좋아요목록", willchange.isAnswerLiked);

    await Promise.all(answers.map(async (answer, index) => {
        if(wa[index]>2 || wa[index]<-2){
            console.log(wa[index]>2 || wa[index]<-2);
            res.status(400).send('Invalid request');
            checkMiddleInvalid = true;
        }
        
        switch (wa[index]) {
            case -1 :
                if(willchange.isAnswerLiked[index]==1) {
                userDoc.RmyLike_list.Ranswer_list = userDoc.RmyLike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());
                userDoc.RmyUnlike_list.Ranswer_list = userDoc.RmyUnlike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());
                userDoc.totalLike -=  1;}
                else if(answer.likes==0) {userDoc.RmyUnlike_list.Rreply_list.push(answer._id);userDoc.RmyLike_list.Ranswer_list = userDoc.RmyLike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());}
                break;
            case -2:
                userDoc.totalLike -=  1;
                userDoc.RmyLike_list.Rreply_list = userDoc.RmyLike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());
                userDoc.RmyUnlike_list.Rreply_list.push(answer._id);
                break;
            case 1:
                if(willchange.isAnswerLiked[index]==-1) {
                    userDoc.RmyLike_list.Rreply_list = userDoc.RmyLike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());
                    userDoc.RmyUnlike_list.Rreply_list = userDoc.RmyUnlike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());
                }
                else if(willchange.isAnswerLiked[index]==0) {userDoc.RmyLike_list.Rreply_list.push(answer._id);userDoc.RmyUnlike_list.Rreply_list = userDoc.RmyUnlike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());userDoc.totalLike +=  1;}
                break;
            case 2:
                userDoc.totalLike  +=  1;
                userDoc.RmyUnlike_list.Rreply_list = userDoc.RmyUnlike_list.Rreply_list.filter(item => item.toString() !== answer._id.toString());
                userDoc.RmyLike_list.Rreply_list.push(answer._id);
                break;
            case 0:
                break;
            default:
                console.log("좋아요", wa[index]);
                res.status(400).send('Invalid request');
                checkMiddleInvalid = true;
                break;
        }

        if(checkMiddleInvalid) return;

        answer.likes += wa[index];

        await answer.save();
        if (answer.likes != 0) {
            const answerUser = doc.answer_list[index].Ruser;
            await notify.Author(answerUser, doc._id, doc.title, req.decryptedUserData.name, 3, "/qna");
            if (answer.likes % 10 == 0) {
                await notify.Author(answerUser, doc._id, doc.title, req.decryptedUserData.name, 7, '/qna');
            }
        }
    }));}

    if(checkMiddleInvalid) return;
}
    const lk = Number(willchange.like);
    doc.likes += lk;

    // reward check and notify
    let modal = rewardNullCheck(3, userDoc, willchange)
    if(!modal.status){
        modal = rewardOtherCheck(1, userDoc, willchange);
    }
    if(modal.status){
        await notify.Self(req.decryptedSessionId, doc._id, doc.title, req.decryptedUserData.name, 3, "/qna");
    }

    if(doc.likes!=0){
        await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 3, "/qna");
        if(doc.likes%10==0) await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 7, '/qna');
    }
    if(doc.scrap!=0){
        await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 4, "/qna");
        if(doc.scrap%10==0) await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 7, '/qna');
    }
    console.log("처리이전:",userDoc.toJSON());
    const islk = Number(willchange.isLiked);
    switch (lk) {
        case -1 : 
            if(islk==1) {userDoc.RmyLike_list.Rqna_list = userDoc.RmyLike_list.Rqna_list.filter(item => item.toString() !== id.toString());
                userDoc.RmyUnlike_list.Rqna_list = userDoc.RmyUnlike_list.Rqna_list.filter(item => item.toString() !== id.toString());
                userDoc.totalLike -=  1; console.log("문제", userDoc.RmyUnlike_list.Rqna_list);}
            else if(islk==0) {userDoc.RmyUnlike_list.Rqna_list.push(id);userDoc.RmyLike_list.Rqna_list = userDoc.RmyLike_list.Rqna_list.filter(item => item.toString() !== id.toString());}
            break;
        case -2:
            userDoc.totalLike -=  1;
            userDoc.RmyLike_list.Rqna_list = userDoc.RmyLike_list.Rqna_list.filter(item => item.toString() !== id.toString());
            console.log(userDoc.RmyUnlike_list.Rqna_list);
            userDoc.RmyUnlike_list.Rqna_list.push(id);
            break;
        case 1: 
            if(islk==-1) {
                userDoc.RmyLike_list.Rqna_list = userDoc.RmyLike_list.Rqna_list.filter(item => item.toString() !== id.toString());
                userDoc.RmyUnlike_list.Rqna_list = userDoc.RmyUnlike_list.Rqna_list.filter(item => item.toString() !== id.toString());}
            else if(islk==0) {userDoc.RmyLike_list.Rqna_list.push(id);userDoc.RmyUnlike_list.Rqna_list = userDoc.RmyUnlike_list.Rqna_list.filter(item => item.toString() !== id.toString());userDoc.totalLike +=  1;}
            break;
        case 2:
            userDoc.totalLike  +=  1;
            userDoc.RmyUnlike_list.Rqna_list = userDoc.RmyUnlike_list.Rqna_list.filter(item => item.toString() !== id.toString());
            userDoc.RmyLike_list.Rqna_list.push(id);
            break;
        case 0:
            break;
        default:
            console.log("좋아요", willchange.like);
            res.status(400).send('Invalid request');
            checkMiddleInvalid = true;
            break;
    }
    console.log("처리이후:",userDoc.toJSON());

    if(checkMiddleInvalid) return;

    console.log(willchange.scrap);
    switch (willchange.scrap) {
        case "false":
            if(willchange.isScrapped=="true") {userDoc.RmyScrap_list.Rqna_list.filter(item => item !== id);
            doc.scrap -= 1;}
            break;
        case "true":
            if(willchange.isScrapped=="false"){userDoc.RmyScrap_list.Rqna_list.push(id);
            doc.scrap += 1;}
            break;
        default:
            console.log("스크랩");
            res.status(400).send('Invalid request');
            checkMiddleInvalid = true;
            break;
    }

    if(checkMiddleInvalid) return;

    switch (willchange.alarm) {
        case "false":
            if(willchange.isAlarm) {doc.Rnotifyusers_list.filter(item => item !== received._id);userDoc.Rnotify_list.filter(item=>item!==id);}
            break;
        case "true":
            if(!willchange.isAlarm) {doc.Rnotifyusers_list.push(received._id);userDoc.Rnotify_list.push(id);}
            break;
        default:
            console.log("알람");
            res.status(400).send('Invalid request');
            checkMiddleInvalid = true;
            break;
    }

    if(checkMiddleInvalid) return;

    const {status, ...mod} = modal;
    doc.save();
    userDoc.save();
    res.status(200).send({isModal : status, modal : mod});

}

export { handleUpdatePage };