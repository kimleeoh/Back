import s3Handler from "../../../config/s3Handler.js";
import fs from 'fs';
import { QnaDocuments } from "../../../schemas/docs.js";
import mainInquiry from "../../../functions/mainInquiry.js";
import { notify } from "../../../functions/notifier.js";

const handleIsManage = async(req,res)=>{
    try{
        if(mainInquiry.isNotRedis()){
            const redisClient = redisHandler.getRedisClient();
            mainInquiry.inputRedisClient(redisClient);
        }
        const uid = await mainInquiry.read(['_id'],req.decryptedSessionId);
        const doc = await QnaDocuments.findById(req.body.id);

        if(doc.Ruser === uid._id){
            res.status(200).send('Manage');
        }
        else{
            res.status(404).send('Not Found');
        }
    }catch(e){
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
}

const handleManageUpdatePage = async (req, res) => {
    const { id, removeImg, content, title } = req.body;
    try{
    const doc = await QnaDocuments.findById(id);

    if(req.files!==undefined){
        const linkList = [];
        console.log(req.files);
        for (const a of req.files){
            const fileStream = fs.createReadStream(a.path);
            const imgLink = await s3Handler.put('Q', fileStream)
            linkList.push(imgLink);
            fs.unlinkSync(a.path)
        }
        doc.img_list = doc.img_list.filter(img => !removeImg.includes(img));
        doc.img_list.push(...linkList);
    }
    await s3Handler.delete(removeImg);

    doc.content = content;
    doc.title = title;
    doc.time = Date.now();
    await doc.save();
    await notify.Follower(doc.Rnotifyusers_list, doc._id, doc.title, req.decryptedUserData.name, 1);
    res.status(200).send('Successfully updated');}
    catch(e){
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
}

const handleManagePickPage = async (req, res) => {
    const { id, picked_index } = req.body;

    const doc = await QnaDocuments.findById(id);
    doc.picked_index = picked_index;
    const pickedPeople = doc.answer_list[picked_index].Ruser;

    await doc.save();

    await notify.Author(pickedPeople, doc._id, doc.title, req.decryptedUserData.name, 12);
    await notify.Follower(doc.Rnotifyusers_list, doc._id, doc.title, req.decryptedUserData.name, 11);
    res.status(200).send('Successfully updated');
}

export { handleIsManage, handleManageUpdatePage, handleManagePickPage };