import mainInquiry from "../../../functions/mainInquiry.js";
import { QnaAnswers, QnaDocuments } from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js";
import { UserDocs } from "../../../schemas/userRelated.js";


const handleRenderQnaPage = async(req, res)=>{
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const Doc = await mainInquiry.read(['Rdoc', '_id'], req.decryptedSessionId);
    const shouldIshowLS = await UserDocs.findById(Doc.Rdoc, {RmyLike_list:1, RmyScrap_list:1});
    const Qdoc = await QnaDocuments.findById(req.body.id);
    req.session.currentDocs =
        {category: "QnA",
        category_id: Qdoc.Rcategory,
        isLiked: shouldIshowLS.RmyLike_list.includes(req.body.id),
        like: 0,
        isScrapped: shouldIshowLS.RmyScrap_list.includes(req.body.id),
        scrap:false,
        isAlarm:Qdoc.Rnotifyusers_list.includes(Doc._id),
        alarm:false,
        answer_like_list : Array(size).fill(0)
        };
    req.session.recentDocs.enqueue({
        category: "QnA",
        _id: Qdoc._id,
        title: Qdoc.title,
        writer:Qdoc.user_main,
        time: Qdoc.time,
        like: Qdoc.likes,
        view: Qdoc.views+1,
        preview_content: Qdoc.preview_content,
        img: Qdoc.img_list[0],
        restrict_type: Qdoc.restricted_type,
        point: Qdoc.point
    });
    const { answer_list, now_category_list, view, ...others} = Qdoc;

    const onlyString = now_category_list.map(item => Object.values(item)[0]);

    const RanswerList = answer_list.map(answer => answer.Ranswer);
    const RuserList = answer_list.map(answer => answer.Ruser);
    const gradeList = answer_list.map(answer => answer.user_grade);

    const answers = await QnaAnswers.findById({_id:{$in:RanswerList}}, { Rqna:0, warn_why_list:0});
    const users = await User.findById({_id:{$in:RuserList}}, {hakbu:1, name:1, profile_img:1, level:1});
    
    const res_list = answers.map((answer, index) => ({
            ...answer,
            ...users[index],
            ...RuserList[index],
            ...gradeList[index]
        }));
    const returnData = {
        others,
        view: view+1,
        onlyString,
        answer_list: res_list,
        alarm: req.session.currentDocs.isAlarm
    };

    res.status(200).send(returnData);}
    catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }

}

export {handleRenderQnaPage};