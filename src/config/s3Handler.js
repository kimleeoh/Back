// import { S3 } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";
// import { fromPath } from "pdf2pic"; // pdf2pic 라이브러리 사용

// const s3Handler = (() => {
//     let currentFileNums = {
//         profile: 0,
//         preview: 0,
//         files: 0,
//         Q: 0,
//         A: 0,
//         confirm: 0,
//         badge: 0,
//     };

//     let S3client = 0;
//     let bucketName = "nah"; // 기본 버킷 이름 설정

//     return {
//         // S3 클라이언트 생성
//         create: (envWrap) => {
//             S3client = new S3({
//                 region: envWrap[0],
//                 credentials: {
//                     accessKeyId: envWrap[1],
//                     secretAccessKey: envWrap[2],
//                 },
//             });
//             bucketName = envWrap[3];
//         },

//         // S3 연결 테스트
//         connect: async () => {
//             await S3client.getObject({ Bucket: bucketName, Key: "test.png" })
//                 .then((result) => {
//                     if (result != undefined) {
//                         console.log("Successfully connected to S3");
//                     }
//                 })
//                 .catch((e) => console.error(e));
//         },

//         // 이미지 업로드
//         uploadImage: async (img, fileDestination) => {
//             const u = new Upload({
//                 client: S3client,
//                 params: {
//                     Bucket: bucketName,
//                     Key: `${fileDestination}/${currentFileNums[fileDestination]}.jpg`,
//                     Body: img,
//                 },
//             });

//             await u.done();
//             const link = `https://d1bp3kp7g4awpu.cloudfront.net${fileDestination}/${currentFileNums[fileDestination]}.jpg`;
//             currentFileNums[fileDestination]++;
//             return link;
//         },

//         // PDF 파일 처리 및 미리보기 생성
//         uploadPDFWithPreview: async (pdfFile, fileDestination) => {
//             // 1. PDF 첫 페이지를 이미지로 변환 (pdf2pic 사용)
//             const options = {
//                 density: 100,
//                 saveFilename: `preview_${currentFileNums[fileDestination]}`,
//                 savePath: "./temp", // 임시 경로에 파일 저장
//                 format: "jpg",
//                 width: 600,
//                 height: 800,
//             };
//             const pdfConvert = fromPath(pdfFile.path, options); // pdf2pic 설정
//             const previewImage = await pdfConvert(1); // 첫 페이지만 변환

//             // 2. PDF 업로드
//             const pdfUpload = new Upload({
//                 client: S3client,
//                 params: {
//                     Bucket: bucketName,
//                     Key: `${fileDestination}/${currentFileNums[fileDestination]}.pdf`,
//                     Body: pdfFile,
//                 },
//             });
//             await pdfUpload.done();
//             const pdfLink = `https://d1bp3kp7g4awpu.cloudfront.net${fileDestination}/${currentFileNums[fileDestination]}.pdf`;

//             // 3. 변환된 이미지 업로드 (미리보기)
//             const previewUpload = new Upload({
//                 client: S3client,
//                 params: {
//                     Bucket: bucketName,
//                     Key: `${fileDestination}/${currentFileNums[fileDestination]}_preview.jpg`,
//                     Body: previewImage.path, // 변환된 이미지 경로
//                 },
//             });
//             await previewUpload.done();
//             const previewLink = `https://d1bp3kp7g4awpu.cloudfront.net${fileDestination}/${currentFileNums[fileDestination]}_preview.jpg`;

//             currentFileNums[fileDestination]++; // 파일 인덱스 증가
//             return { link: pdfLink, preview: previewLink };
//         },

//         // 파일 삭제
//         delete: async (imgLink) => {
//             await S3client.deleteObject({ Bucket: bucketName, Key: imgLink });
//         },
//     };
// })();

// export default s3Handler;

import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3Handler = (() => {
    let currentFileNums = {
        profile: 0,
        preview: 0,
        files: 0,
        Q: 0,
        A: 0,
        confirm: 0,
        badge: 0,
    };

    let S3client = 0;
    let bucketName = "nah";

    return {
        create: (envWrap) => {
            S3client = new S3({
                region: envWrap[0],
                credentials: {
                    accessKeyId: envWrap[1],
                    secretAccessKey: envWrap[2],
                },
            });
            bucketName = envWrap[3];
        },
        connect: async () => {
            await S3client.getObject({ Bucket: bucketName, Key: "test.png" })
                .then((result) => {
                    if (result != undefined) {
                        console.log("Successfully connected to S3");
                    }
                })
                .catch((e) => console.error(e));
        },
        get: async (imgLink) => {
            S3client.getObject({ Bucket: bucketName, Key: imgLink }).then(
                (result) => {
                    return result.Body;
                }
            );
        },
         put: async (fileDestination, img) => {
            
            const mimeType = img.mimetype || "image/jpeg";  // MIME 타입이 없으면 기본적으로 image/jpeg 사용
            const extension = mimeType.split("/")[1]; // 확장자 추출 (예: "png")

            const u = new Upload({
                client: S3client,
                params: {
                    Bucket: bucketName,
                    Key: `${fileDestination}/${currentFileNums[fileDestination]}.${extension}`, // 확장자를 동적으로 설정
                    Body: img, 
                },
            });
            // await S3client.putObject({
            //     Bucket: bucketName,
            //     Key:
            //         fileDestination +
            //         "/" +
            //         currentFileNums[fileDestination] +
            //         ".jpg",
            //     Body: img,
            // });
            await u.done();
            const link = `https://d1bp3kp7g4awpu.cloudfront.net/${fileDestination}/${currentFileNums[fileDestination]}.${extension}`;
            currentFileNums[fileDestination]++;
            return link;
        },
        delete: async (imgLink) => {
            await S3client.deleteObject({ Bucket: bucketName, Key: imgLink });
        },
    };
})();

export default s3Handler;
