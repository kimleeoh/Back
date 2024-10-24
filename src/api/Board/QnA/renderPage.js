import mainInquiry from "../../../functions/mainInquiry.js";
import { QnaAnswers, QnaDocuments } from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js";
import { Score, UserDocs } from "../../../schemas/userRelated.js";
import redisHandler from "../../../config/redisHandler.js";
import mongoose from "mongoose";

const handleRenderQnaPage = async(req, res)=>{
    const {id} = req.query;
    console.log(id);
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const Doc = await mainInquiry.read(['Rdoc', '_id', 'Rscore', 'level', 'hakbu', 'name', 'profile_img'], req.decryptedSessionId);
    const shouldIshowLS = await UserDocs.findById(Doc.Rdoc, {RmyLike_list:1, RmyScrap_list:1, RmyUnlike_list:1}).lean();
    const Qdoc = await QnaDocuments.findById(id).lean();
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
        if(whatScore !== null){
        const grades = ["A+", "A0", "A-", "B+", "B0", "B-", "C+", "C0", "C-", "F"];
        whatScore = grades[whatScore];}
    }
    if(Qdoc.warn >9) { res.status(403).send({locked:true, message:"신고처리된 게시글입니다."});return;}
    console.log(shouldIshowLS);
    const idfy = id.toString();

    const p = (targ,idfy)=>{
        let pp = 1;
        if(shouldIshowLS.RmyLike_list[targ]==undefined){
            pp +=3;
        }
        if(shouldIshowLS.RmyUnlike_list[targ]==undefined){
            pp+=5;
        }
        switch(pp){
            case 1:
                if(shouldIshowLS.RmyLike_list[targ].some(item => item.toString() === idfy)){
                    pp+=1;
                }if(shouldIshowLS.RmyUnlike_list[targ].some(item => item.toString() === idfy)){
                    pp+=2;
                }
                if(pp==4)return -3;
                else if(pp==2)return 1;
                else if(pp==3)return -1;
                else if(pp==1)return 0;
            case 4:
                if(shouldIshowLS.RmyUnlike_list[targ].some(item => item.toString() === idfy)){
                    return -1;
                }else return 0;

            case 6:
                if(shouldIshowLS.RmyLike_list[targ].some(item => item.toString() === idfy)) return 1;
                else return 0;
            case 9:
                return 0;
        }
    }
        
    //console.log("session",req.session.recentDocs);
    // req.session.recentDocs.enqueue({
    //     category: "QnA",
    //     _id: Qdoc._id,
    //     title: Qdoc.title,
    //     writer:Qdoc.user_main,
    //     time: Qdoc.time,
    //     like: Qdoc.likes,
    //     view: Qdoc.views+1,
    //     preview_content: Qdoc.preview_content,
    //     img: Qdoc.img_list[0],
    //     restrict_type: Qdoc.restricted_type,
    //     point: Qdoc.point
    // });
    const { answer_list, views,now_category_list, ...others} = Qdoc;

    let res_list = [];
    let answered = -1;
    if(answer_list.length != 0){
    const RanswerList = answer_list.map(answer => answer.Ranswer);
    const RuserList = answer_list.map(answer => answer.Ruser);
    const gradeList = answer_list.map(answer => answer.user_grade);
    const answers = await QnaAnswers.find({_id:{$in:RanswerList}}, { Rqna:0, warn_why_list:0}).lean();
    const users = await User.find({_id:{$in:RuserList}}, {hakbu:1, name:1, profile_img:1, level:1}).lean();
    answered = RuserList.reduce((indices, user, index) => {
    if (user.toString() === Doc._id.toString()) {
        indices.push(index);
    }
    return indices;
}, []); console.log("answered", answered);
    
    res_list = answers.map((answer, index) => ({
        alread:p("Rreply_list", answer._id.toString()),
            ...answer,
            ...users[index],
            ...RuserList[index],
            ...gradeList[index]
        }));
    
    
    }

    const islkd = res_list.map(answer => answer.alread);

    const currentDocs =
        {category: "QnA",
        category_id: Qdoc.Rcategory,
        isLiked: p("Rqna_list", idfy),
        like: 0,
        isScrapped: shouldIshowLS.RmyScrap_list.Rqna_list.some(item => item.toString() === idfy),
        scrap:false,
        isAlarm:Qdoc.Rnotifyusers_list.some(item=> item.toString()==Doc._id.toString()),
        alarm:false,
        answer_like_list : Array(Qdoc.answer_list.length).fill(0),
        isAnswerLiked : islkd,
        score: whatScore,
        };

    const returnData = {
        locked:false,
        ...others,
        view: views+1,
        now_category_list: lastCategory,
        answer_list: res_list,
        isScore: answerAble,
        whatScore,
        level:Doc.level,
        major:Doc.hakbu,
        name:Doc.name,
        profile_img:Doc.profile_img,
        alarm: currentDocs.isAlarm,
        isMine: Doc._id == Qdoc.Ruser,
        answered
    };

    console.log(JSON.stringify(returnData));

    res.status(200).send({returnData: JSON.stringify(returnData), currentDocs});}
    catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }

}

export {handleRenderQnaPage};