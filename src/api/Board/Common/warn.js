import { AdminWarn } from "../../../admin/adminSchemas.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { HoneyDocuments, PilgyDocuments, QnaAnswers, QnaDocuments } from "../../../schemas/docs.js";

//{filters:'', warn_why:''}
const handleWarn = async(req, res) => {    
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    switch(req.body.filters){
        case "qna":
            const r = await QnaDocuments.findById(req.session.currentDocs.id).updateOne({$inc:{warn:1}, $push:{warn_why_list:req.body.warn_why}}, {new:true, projection:{warn:1}}); 
            if(r.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:r.warn, why_list:[r.warn_why_list]});
            }
            break;
        case "answer":
            const f = await QnaAnswers.findById(req.session.currentDocs.id).updateOne({$inc:{warn:1}, $push:{warn_why_list:req.body.warn_why}}, {new:true, projection:{warn:1}}); 
            if(f.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:f.warn, why_list:[f.warn_why_list]});
            }
            break;
        case "pilgy":
            const s = await PilgyDocuments.findById(req.session.currentDocs.id).updateOne({$inc:{warn:1}, $push:{warn_why_list:req.body.warn_why}}, {new:true, projection:{warn:1}}); 
            if(s.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:s.warn, why_list:[s.warn_why_list]});
            }
            break;
        case "honey":
            const q = await HoneyDocuments.findById(req.session.currentDocs.id).updateOne({$inc:{warn:1}, $push:{warn_why_list:req.body.warn_why}}, {new:true, projection:{warn:1}}); 
            if(q.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:q.warn, why_list:[q.warn_why_list]});
            }
            break;
        case "test":
            const v = await TestDocuments.findById(req.session.currentDocs.id).updateOne({$inc:{warn:1}, $push:{warn_why_list:req.body.warn_why}}, {new:true, projection:{warn:1}}); 
            if(v.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:v.warn, why_list:[v.warn_why_list]});
            }
            break;
    }
}

export { handleWarn };