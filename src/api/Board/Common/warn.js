import { AdminWarn } from "../../../admin/adminSchemas.js";
import redisHandler from "../../../config/redisHandler.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { HoneyDocuments, PilgyDocuments, QnaAnswers, QnaDocuments, TestDocuments } from "../../../schemas/docs.js";

//{filters:'', warn_why:''}
const handleWarn = async(req, res) => {    
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    switch(req.body.filters){
        case "qna":{
            const r = await QnaDocuments.findById(req.session.currentDocs.id);
            r.warn += 1;
            for(let i=0; i<req.body.warn_why.length; i++){
                r.warn_list[i] = r.warn_why_list[i]+req.body.warn_why[i];
            }
            await r.save();
            if(r.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:r.warn, why_list:[r.warn_why_list]});
            }
            }break;
        case "answer":{
            const r = await QnaAnswers.findById(req.session.currentDocs.id); 
            r.warn += 1;
            for(let i=0; i<req.body.warn_why.length; i++){
                r.warn_list[i] = r.warn_why_list[i]+req.body.warn_why[i];
            }
            await r.save();
            if(r.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:r.warn, why_list:[r.warn_why_list]});
            }
            }break;
        case "pilgy":{
            const r = await PilgyDocuments.findById(req.session.currentDocs.id);
            r.warn += 1;
            for(let i=0; i<req.body.warn_why.length; i++){
                r.warn_list[i] = r.warn_why_list[i]+req.body.warn_why[i];
            }
            await r.save();
            if(r.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:r.warn, why_list:[r.warn_why_list]});
            }}
            break;
        case "honey":{
            const r = await HoneyDocuments.findById(req.session.currentDocs.id);
            r.warn += 1;
            for(let i=0; i<req.body.warn_why.length; i++){
                r.warn_list[i] = r.warn_why_list[i]+req.body.warn_why[i];
            }
            await r.save();
            if(r.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:r.warn, why_list:[r.warn_why_list]});
            }}
            break;
        case "test":{
            const r = await TestDocuments.findById(req.session.currentDocs.id)
            r.warn += 1;
            for(let i=0; i<req.body.warn_why.length; i++){
                r.warn_list[i] = r.warn_why_list[i]+req.body.warn_why[i];
            }
            await r.save();
            if(r.warn>=10){
                const check = await mainInquiry.read(['warned'],req.decryptedSessionId);
                if(check.warned>8) mainInquiry.write({confirmed:1, warned:1},req.decryptedSessionId);
                else await mainInquiry.write({warned:1},req.decryptedSessionId);
                await AdminWarn.create({Rdoc:req.session.currentDocs.id, count:r.warn, why_list:[r.warn_why_list]});
            }
        }
            break;
    }
}

export { handleWarn };