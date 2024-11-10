import { User } from "../schemas/user.js";
import { CustomBoardView } from "../schemas/userRelated.js";
//반드시 router 내부에서 이 함수가 작동할 수 있도록 할 것.

const mainInquiry = (() => {
    let redisClient = null;
    const stringFields = ["hakbu", "intro", "profile_img", "exp"];
    const listFields = ["Rbadge_list", "Rnotify_list", "notify_meta_list", "Rmodal_noti_list"];
    const rlistFields = ["-Rbadge_list", "-Rnotify_list", "-notify_meta_list", "-Rmodal_noti_list"];
    const boardFields = ["Renrolled_list", "Rbookmark_list", "Rlistened_list"];
    const checkFields = ["uNullRewardList", "uMultiRewardList"];

    return {
        isNotRedis: () => {
            return redisClient == null;
        },

        inputRedisClient: (cli) => {
            redisClient = cli;
        },

        read: async (paramList, redisId) => {
            console.log(redisId);
            // redisId가 문자열로 전달되도록 보장
            if (typeof redisId !== "string") {
                redisId = String(redisId);
            }
            let stringfiedJSON = await redisClient.get(redisId);
            // Redis에서 데이터가 없을 때 예외 처리 추가
            if (!stringfiedJSON) {
                console.log(redisId);
                stringfiedJSON = await redisClient.get(redisId);
                if (!stringfiedJSON) {
                    throw new Error(
                        "No data found in Redis for the given session ID"
                    );
                }
            }
            console.log("Raw data from Redis:", stringfiedJSON); // Redis에서 가져온 데이터 로그 출력
            const userInfo = JSON.parse(stringfiedJSON);
            // userInfo가 유효한지 확인 (예외 처리 추가)
            if (!userInfo || !userInfo._id) {
                console.error("Invalid user data:", userInfo); // 유효하지 않은 사용자 데이터 로그 출력
                throw new Error("Invalid user data found in Redis");
            }

            // let returnParam = Object.create(null);
            // // Add multiple fields to returnParam
            // paramList.forEach((param) => {
            //     returnParam[param] = userInfo[param];
            // });
            // return returnParam;

            // 요청된 필드만 반환
            let returnParam = {};
            paramList.forEach((param) => {
                if (userInfo[param] !== undefined) {
                    returnParam[param] = userInfo[param];
                }
            });

            console.log("User info from Redis:", returnParam); // 반환될 사용자 정보 출력
            return returnParam;
            // return keys.reduce((result, key) => {
            //     if (userInfo.hasOwnProperty(key)) {
            //         result[key] = userInfo[key];
            //     }
            //     return result;
            // }, {});
        },
        write: async (paramObject, redisId) => {
            let RedisId = String(redisId);
            const stringfiedJSON = await redisClient.get(RedisId);
            if (!stringfiedJSON) {
                throw new Error(
                    "No data found in Redis for the given session ID"
                );
            }

            const userInfo = JSON.parse(stringfiedJSON);

            if (!userInfo || !userInfo._id) {
                throw new Error("Invalid user data found in Redis");
            }

            let stringChunk = {};
            let listChunk = {};
            let rlistChunk = {};
            let BlistChunk = {};
            let checkListChunk = {};
            let numChunk = {};
            let updateObject = {};
            let brdUpdateObject = {};

            // 전달된 paramObject에 따라 필드 분류
            Object.keys(paramObject).forEach((key) => {
                        if (boardFields.includes(key)) {
                            // 기존 데이터와 새로운 데이터를 병합
                            const existingData = userInfo[key] || [];
                            BlistChunk[key] = paramObject[key]; // 새로운 데이터로 덮어쓰기

                            // 중복된 데이터 제거 (중복 제거를 원하지 않을 경우 이 부분 생략)
                            BlistChunk[key] = Array.from(
                                new Set(BlistChunk[key])
                            );
                        } else if (stringFields.includes(key)) {
                            stringChunk[key] = paramObject[key];
                        } else if (listFields.includes(key)) {
                            listChunk[key] = paramObject[key];
                        } else if (rlistFields.includes(key)) {
                            rlistChunk[key] = paramObject[key];
                        } else if(checkFields.includes(key)){
                            checkListChunk[key] = paramObject[key];
                        }else if (
                            typeof paramObject[key] === "number" &&
                            key !== "level"
                        ) {
                           // exp는 직접 설정하기 위해 $inc 대신 $set 사용
                            
                            numChunk[key] = paramObject[key];
                            
                        } else {
                            stringChunk[key] = paramObject[key]; // $set으로 처리
                        }
            });

            // MongoDB 업데이트용 updateObject 구성
            if (Object.keys(stringChunk).length > 0) {
                updateObject.$set = stringChunk;
            }
            if (Object.keys(listChunk).length > 0) {
                updateObject.$push = listChunk;
            }
            if (Object.keys(rlistChunk).length > 0) {
                updateObject.$pull = rlistChunk;
            }
            if (Object.keys(numChunk).length > 0) {
                updateObject.$inc = numChunk; // level 제외한 숫자 필드만 증가
            }
            if (Object.keys(BlistChunk).length > 0) {
                brdUpdateObject.$set = BlistChunk;
            }
            if(Object.keys(checkListChunk).length > 0){
                updateObject.$set = checkListChunk;
            }

            // MongoDB에서 사용자 정보 업데이트
            if (Object.keys(updateObject).length > 0) {
                try {
                    // MongoDB에서 사용자 정보 업데이트
                    const result = await User.findOneAndUpdate(
                        { _id: userInfo._id }, // userInfo의 _id를 사용하여 업데이트
                        updateObject,
                        { new: true }
                    ).lean();

                    console.log("\nuserinfo: ", userInfo);

                    let brd = {
                        Renrolled_list: userInfo.Renrolled_list,
                        Rlistened_list: userInfo.Rlistened_list,
                        Rbookmark_list: userInfo.Rbookmark_list,
                    };

                    if (Object.keys(brdUpdateObject).length > 0)
                        brd = await CustomBoardView.findByIdAndUpdate(
                            result.Rcustom_brd,
                            brdUpdateObject,
                            { new: true }
                        )
                            .select("-_id")
                            .lean();

                    if (!result) {
                        throw new Error("Failed to update user in MongoDB");
                    }

                    const willreturn = {
                        ...result,
                        ...brd,
                    };

                    // 업데이트된 사용자 정보를 Redis에 다시 저장
                    await redisClient.set(
                        RedisId,
                        JSON.stringify(willreturn),
                        "EX",
                        3600 // 1시간 동안 Redis에 저장
                    );
                    return willreturn;
                } catch (err) {
                    console.error("Error updating MongoDB:", err);
                    throw new Error("Failed to update user in MongoDB");
                }
                
            } else {
                let brd = {
                    Renrolled_list: userInfo.Renrolled_list,
                    Rlistened_list: userInfo.Rlistened_list,
                    Rbookmark_list: userInfo.Rbookmark_list,
                };

                if (Object.keys(brdUpdateObject).length > 0)
                    brd = await CustomBoardView.findByIdAndUpdate(
                        userInfo.Rcustom_brd,
                        brdUpdateObject,
                        { new: true }
                    )
                        .select("-_id")
                        .lean();
                const {
                    Renrolled_list,
                    Rlistened_list,
                    Rbookmark_list,
                    ...willreturn
                } = userInfo;
                const willreturn2 = {
                    ...willreturn,
                    ...brd,
                };
                console.log(willreturn2);
                await redisClient.set(
                    RedisId,
                    JSON.stringify(willreturn2),
                    "EX",
                    3600 // 1시간 동안 Redis에 저장
                );
                console.log("user.");
                return willreturn2;
            }
        },
    };
})();

export default mainInquiry;
