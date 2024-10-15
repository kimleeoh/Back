import { QnaAnswers, QnaDocuments } from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js";


const qnaPage = async(req, res)=>{
    try{
    const doc = await QnaDocuments.findById(req.body.id);
    req.session.currentDocs =
        {category: "QnA",
        like: 0,
        scrap:0,
        answer_like_list : Array(size).fill(0)
        };
    req.session.recentDocs.enqueue({
        category: "QnA",
        _id: doc._id,
        title: doc.title,
        writer:doc.user_main,
        time: doc.time,
        like: doc.likes,
        view: doc.views+1,
        preview_content: doc.preview_content,
        img: doc.img_list[0],
        restrict_type: doc.restricted_type,
        point: doc.point
    });
    const { answer_list, now_category_list, view, ...others} = doc;

    const onlyString = now_category_list.map(item => Object.values(item)[0]);

    const RanswerList = answer_list.map(answer => answer.Ranswer);
    const RuserList = answer_list.map(answer => answer.Ruser);
    const gradeList = answer_list.map(answer => answer.user_grade);

    const answers = await QnaAnswers.findById({_id:{$in:RanswerList}}, {_id:0, Rqna:0, warn_why_list:0});
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
        answer_list: res_list
    };

    res.status(200).send(returnData);}
    catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }

}