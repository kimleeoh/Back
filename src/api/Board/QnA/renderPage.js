import mainInquiry from "../../../functions/mainInquiry.js";
import { QnaAnswers, QnaDocuments } from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js";
import { Score, UserDocs } from "../../../schemas/userRelated.js";


const handleRenderQnaPage = async(req, res)=>{
    const {id} = req.params;
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const Doc = await mainInquiry.read(['Rdoc', '_id', 'Rscore'], req.decryptedSessionId);
    const shouldIshowLS = await UserDocs.findById(Doc.Rdoc, {RmyLike_list:1, RmyScrap_list:1}).lean();
    const Qdoc = await QnaDocuments.findById(id);
    let answerAble = true;
    let whatScore = null;
    const lastCategory = Object.values(Qdoc.now_category_list[Qdoc.now_category_list.length - 1])[0];
    if(Qdoc.restricted_type==true){
        const Ascore = await Score.findById(Doc.Rscore, {overA_subject_list:1, overA_type_list:1});
        const see = Ascore.overA_subject_list.findIndex(subject => subject === lastCategory);
        answerAble = see==-1? false : true;
        whatScore = see === -1 ? null : Ascore.overA_type_list[see];
        whatScore = whatScore === 2 ? "A-" : whatScore === 1 ? "A0" : whatScore === 0 ? "A+" : whatScore;
    }else{
        const sc = await Score.findById(Doc.Rscore, {semester_list:1});
        let see = -1;
        for (let i = sc.semester_list.length - 1; i >= 0; i--) {
            const semester = sc.semester_list[i];
            const index = semester.subject_list.findIndex(subj => subj === lastCategory);
            if (index !== -1) {
                see = [index, i];
                break;
            }
        }
        whatScore = see == -1 ? null : sc.semester_list[see[1]].grade_list[see[0]];
        const grades = ["A+", "A0", "A-", "B+", "B0", "B-", "C+", "C0", "C-", "F"];
        whatScore = grades[whatScore];
    }
    if(Qdoc.warn >9) { res.status(403).send({locked:true, message:"신고처리된 게시글입니다."});return;}
    req.session.currentDocs =
        {category: "QnA",
        category_id: Qdoc.Rcategory,
        isLiked: shouldIshowLS.RmyLike_list.Rqna_list.includes(id),
        like: 0,
        isScrapped: shouldIshowLS.RmyScrap_list.Rqna_list.includes(id),
        scrap:false,
        isAlarm:Qdoc.Rnotifyusers_list.includes(Doc._id),
        alarm:false,
        answer_like_list : Array(Qdoc.answer_list.length).fill(0),
        score: whatScore,
        };
    console.log(req.session.recentDocs);
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
        locked:false,
        others,
        view: view+1,
        onlyString,
        answer_list: res_list,
        isScore: answerAble,
        whatScore,
        alarm: req.session.currentDocs.isAlarm
    };

    res.status(200).send(returnData);}
    catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }

}

export {handleRenderQnaPage};