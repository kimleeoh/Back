import mainInquiry from '../../../functions/mainInquiry.js';
import { notify } from '../../../functions/notifier.js';
import { rewardNullCheck, rewardOtherCheck } from '../../../functions/rewardCheck.js';
import {QnaDocuments, QnaAnswers} from '../../../schemas/docs.js';
import { UserDocs } from '../../../schemas/userRelated.js';

const handleUpdatePage = async (req, res) => {

    const {id} = req.body;

    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const received = await mainInquiry.read(['_id','Rdoc'],req.decryptedSessionId);
    const userDoc = await UserDocs.findById(received.Rdoc);
    const doc = await QnaDocuments.findById(id);

    const willchange = req.session.currentDocs;

    doc.views += 1;
    const RanswerList = doc.answer_list.map(answer => answer.Ranswer);
    const answers = await QnaAnswers.findById({_id:{$in:RanswerList}});
    await Promise.all(answers.map(async (answer, index) => {
        answer.likes += willchange.answer_like_list[index];
        await answer.save();
        if (answer.likes != 0) {
            const answerUser = doc.answer_list[index].Ruser;
            await notify.Author(answerUser, doc._id, doc.title, req.decryptedUserData.name, 3);
            if (answer.likes % 10 == 0) {
                await notify.Author(answerUser, doc._id, doc.title, req.decryptedUserData.name, 7);
            }
        }
    }));
    doc.likes += willchange.like;

    // reward check and notify
    let modal = rewardNullCheck(3, userDoc, willchange)
    if(!modal.status){
        modal = rewardOtherCheck(1, userDoc, willchange);
    }
    if(modal.status){
        await notify.Self(req.decryptedSessionId, doc._id, doc.title, req.decryptedUserData.name, 3);
    }

    if(doc.likes!=0){
        await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 3)
        if(doc.likes%10==0) await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 7);
    }
    if(doc.scrap!=0){
        await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 4)
        if(doc.scrap%10==0) await notify.Author(doc.Ruser, doc._id, doc.title, req.decryptedUserData.name, 7);
    }

    switch (willchange.like) {
        case -1:
            if(willchange.isLiked) userDoc.RmyLike_list.Rqna_list.filter(item => item !== id);
            break;
        case 1:
            userDoc.totalLike += 1;
            userDoc.RmyLike_list.Rqna_list.push(id);
            userDoc.RmyScrap_list.Rqna_list.push(id);
            break;
    }
    switch (willchange.scrap) {
        case 0:
            if(willchange.isScrapped) {userDoc.RmyScrap_list.Rqna_list.filter(item => item !== id);
            doc.scrap -= 1;}
            break;
        case 1:
            if(!willchange.isScrapped){userDoc.RmyScrap_list.Rqna_list.push(id);
            doc.scrap += 1;}
            break;
    }
    switch (willchange.alarm) {
        case 0:
            if(willchange.isAlarm) {doc.Rnotifyusers_list.filter(item => item !== received._id);}
            break;
        case 1:
            if(!willchange.isAlarm) doc.Rnotifyusers_list.push(received._id);
            break;
    }

    

    const {status, ...mod} = modal;
    doc.save();
    userDoc.save();
    res.status(200).send({isModal : status, modal : mod});

}

export { handleUpdatePage };