import { AdminScore } from "../../admin/adminSchemas.js";
import { Score } from "../../schemas/userRelated.js";
import mainInquiry from "../../functions/mainInquiry.js";
import redisHandler from "../../config/redisHandler.js";
import s3Handler from "../../config/s3Handler.js";
import fs from "fs";
import { rewardNullCheck } from "../../functions/rewardCheck.js";
import { notify } from "../../functions/notifier.js";

const handleGetScore = async (req, res) => {    
    //아무것도 안보내고 걍 get하셈
    try{
        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        
        let r = await mainInquiry.read(['Rscore'], req.decryptedSessionId);
        if(!r){
            r = await mainInquiry.read(['Rscore'], req.decryptedSessionId);
        }

        const result = await Score.findById(r.Rscore, {semester_list:1});
        res.status(200).json(result);
    }catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

const handleUploadScore = async (req, res) => {
    try{
        console.log(req.body);
        let { score, semester } = req.body;
        score = JSON.parse(score);
        semester = Number(semester);
        //score의 형식
        // Rcategory_list: Types.ObjectId[];
        // subject_list: string[];
        // grade_list: number[];
        // ismajor_list: boolean[];

        //semester는 0부터 시작, 2018년 1학기 기준

        console.log(score, semester);
        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const received = await mainInquiry.read(['Rscore','_id', 'uNullRewardList'], req.decryptedSessionId);

        const sc = await Score.findById(received.Rscore);
        
        const indexes = score.subject_list.reduce((acc, cur, idx) => {
            if(!sc.semester_list[semester].subject_list.includes(cur)){
                acc.push(idx);
            }
            return acc;
        }, []);

        const credit = Array(score.subject_list.length).fill(false);

        console.log("credit",credit);

        for (const field in score) {
            score[field] = indexes.map(idx => score[field][idx]);
            sc.semester_list[semester][field].push(...score[field]);
        }

        sc.semester_list[semester].credit_list.push(...credit);
        sc.semester_list[semester].is_show_list.push(...credit);
        sc.semester_list[semester].confirmed = 1;
        sc.semester_list[semester].filled = true;

        sc.save();

        const m = rewardNullCheck(4, sc, "", received.uNullRewardList);
        if(m.status){
            await mainInquiry.write({'uNullRewardList':m.uNullRewardList}, req.decryptedSessionId);
            await notify.Self(req.decryptedSessionId, m, "", 8, "", "");
        }

        console.log(req.files, req.file);

        const fileStream = fs.createReadStream(req.file.path);
        const link = await s3Handler.put('confirm', fileStream);
        fs.unlinkSync(req.file.path);

        const scoreChunk = {
            Rscore:received.Rscore,
            Ruser:received._id,
            index:semester,
            confirm_img:link,
        };

        await AdminScore.findByIdAndUpdate("4", {$push: {score_list: scoreChunk}});
        
        res.status(200).send("OK");
    }catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export { handleGetScore, handleUploadScore };