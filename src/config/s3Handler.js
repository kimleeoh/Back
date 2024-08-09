import { S3 } from "@aws-sdk/client-s3"

const s3Handler = (() => {
    let currentFileNums = {
        "profile": 0,
        "preview": 0,
        "files": 0,
        "Q": 0,
        "A": 0,
        "Confirm": 0,
        "badge": 0
    };

    let S3client = 0;
    let bucketName = "nah";

    return {
        create: (envWrap) => {S3client = new S3({
            region: envWrap[0],
            credentials: {
                accessKeyId: envWrap[1],
                secretAccessKey: envWrap[2]},
        });
        bucketName = envWrap[3];},
        connect: () => {S3client.getObject({Bucket:bucketName, Key:"test.png"})
            .then((result)=>{if(result!=undefined){console.log('Successfully connected to S3');}})
            .catch(e=>console.error(e));},
        get: (imgLink)=>{S3client.getObject({Bucket:bucketName, Key:imgLink}).then((result)=>{return result.Body;});},
        put: (fileDestination, img)=>{
            S3client.putObject({Bucket:bucketName, Key:fileDestination+"/"+currentFileNums[fileDestination]+".jpg", Body:img});
            currentFileNums[fileDestination]++;
        },
        delete: (imgLink)=>{S3client.deleteObject({Bucket:bucketName, Key:imgLink});},
    };
})();

export default s3Handler;
  
