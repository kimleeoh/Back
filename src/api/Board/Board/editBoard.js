import mainInquiry from "../../../functions/mainInquiry.js";
import { CustomBoardView } from "../../../schemas/userRelated.js";

const handleEditBoard = async (req, res) => {
    //ex) {type:1(내가수강중)/2(즐겨찾기)/3(내가수강했던), subject:[]}
    try{
    if(mainInquiry.isNotRedis()){
        const redisClient = redisHandler.getRedisClient();
        mainInquiry.inputRedisClient(redisClient);
    }
    const r = await mainInquiry.read(['Rcustom_brd'],req.decryptedSessionId);
    switch (req.body.type) {
        case 1:
            await CustomBoardView.findByIdAndUpdate(r.Rcustom_brd, {Renrolled_list: req.body.subject});
            break;
    
        case 2:
            await CustomBoardView.findByIdAndUpdate(r.Rcustom_brd, {Rbookmark_list: req.body.subject});
            break;
        
        case 3:
            await CustomBoardView.findByIdAndUpdate(r.Rcustom_brd, {Rlistened_list_list: req.body.subject});
            break;
        }
        res.status(200).send("OK");
    }catch(e){
        console.error(e);
        res.status(500).send("Internal Server Error");
    }
}

export{handleEditBoard};