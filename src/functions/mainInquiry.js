import {User} from '../schemas/user.js';
//반드시 router 내부에서 이 함수가 작동할 수 있도록 할 것.

const mainInquiry = (()=>{
    let redisClient = null;
    const stringFields = ['hakbu', 'intro', 'profile_img'];
    return {
        inputRedisClient: (cli)=>{redisClient=cli;},
        read : async (paramList, redisId)=>{
            const stringfiedJSON = await redisClient.sGet(redisId);
            const userInfo = JSON.parse(stringfiedJSON);
            let returnParam = Object.create(null);
            // Add multiple fields to returnParam
            paramList.forEach(param => {
                returnParam[param] = userInfo[param];
            });
            return returnParam;
        },
        write : async (paramObject, redisId)=>{

            let stringChunk = {};
            let listChunk={};
            let numChunk = {};
            let updateObject = {};

            Object.keys(paramObject).forEach(key => {
                if(stringFields.includes(key)){
                    stringChunk[key] = paramObject[key];
                }else if(key == 'Rbadge_list'){
                    listChunk[key] = paramObject[key];
                }else{
                    numChunk[key] = paramObject[key];
                }
            });
            
            if (Object.keys(stringChunk).length > 0) {
                updateObject.$set = stringChunk;
            }
            if (Object.keys(listChunk).length > 0) {
                updateObject.$push = listChunk;
            }
            if (Object.keys(numChunk).length > 0) {
                updateObject.$inc = numChunk;
            }

            if (Object.keys(updateObject).length > 0) {
                const result = await User.updateOne({ _id: userInfo._id }, updateObject, {new:true});
            }
            await redisClient.set(redisId, JSON.stringify(result), 'EX', 3600);

        }
    }
})();

export default mainInquiry;