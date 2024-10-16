import mainInquiry from '../../../functions/mainInquiry';
import {QnaDocuments, QnaAnswers} from '../../../schemas/docs.js';

const handleUpdatePage = async (req, res) => {
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const received = await mainInquiry.read(['_id','Rdoc'],req.decryptedSessionId);
    const doc = await QnaDocuments.findById(req.body.id);
    const willchange = req.session.currentDocs;
    doc.views += 1;
    const RanswerList = doc.answer_list.map(answer => answer.Ranswer);
    const answers = await QnaAnswers.findById({_id:{$in:RanswerList}});
    await answers.map((answer,index) => {
            answer.likes += willchange.answer_like_list[index];
            answer.save();
    });
    doc.likes += willchange.like;

}