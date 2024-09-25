//추후 이거 통해서 몽고디비에 과목 관련 데이터 넣을 예정

import mongoose from "mongoose";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import { Category, LowestCategory} from "../schemas/category.js";
import fs from "fs";
import { QnaAnswers } from "../schemas/docs.js";

dotenv.config();
const { MONGO_URI } = process.env;

mongoose
    .connect(MONGO_URI, {dbName: "root"})
    .then(()=>console.log('Successfully connected to mongodb'))
    .catch(e=>console.error(e));

// await Category.deleteMany({type:3})
//      .then(()=>console.log("Successfully deleted"));

// Category.find({type:2})
//     .then((result)=>result.forEach(async(category)=>{
//         // console.log(category);
//         category.sub_category_list = new Array(0);
//         console.log(category);
//         // await category.save();
        
//         await category.save();
//         console.log("done");
//     }))
//     .catch(e=>console.error(e));




// const stringIds = [[
//     "66cc5b3f27b5b4293a8598bd",
//     "66cc5d67eadfab0801fc9368",
//     "66cc5e5f343e7c5ceee36532",
//     "66cc5f77b1cd4b00fe4d9444",
//     "66cc6143ca52d2e0118eabc5",
//     "66cc623654e1425b5c2056c2",
//     "66cc6301f1a715ac2133a6af",
//     "66cc650384d468bc491a4b3b",
//     "66cc666f2b3f40682f36de5e",
//     "66cc74402cc623a2cd87a805",
//     "66cc74ebd65f00bb4eeb5c5d",
//     "66cc7d1889bbc9e6894e370f",
//     "66cc823299595cef4bfa45df",
//     "66cc84b328a49f74bf062703"
// ],[
//     "66cc8566c0183805a0f1066b",
//     "66cc86186f8ba95f7013f138",
//     "66cc86cc197823e0a46de3f8",
//     "66cc87be40bedb72fb45ce28",
//     "66cc885d67c26c8d26a11ad4"
// ],[
//     "66cc8964af8a91a5aea16010",
//     "66cc8a1b809e4797fd9fc8a0"
// ],[
//     "66cc8a9a3829052db439dd4f",
//     "66cc8b15ab969b9bcfcc9c0a",
//     "66cc8b852ee8dea8b44fad83",
//     "66cc8c0c3bbb9fb06277b2f3",
//     "66cc8ce9fcf1c8942ad6c27e",
//     "66cc8d684e6181f81f0a9c8e"
// ],[
//     "66cc8ddb212b0b742a508947",
//     "66cc8fca54f4733b924a8195",
//     "66cc906235ac36fa211a3da8",
//     "66cc90d5daf16a0295b2d93c",
//     "66cc96a650ba784d404b0dc9",
// ],[
//     "66cc974826f9ec41316b8a6d",
//     "66cc97c6143b91ad78cef6fb",
//     "66cc98782d9bfd44dbd43806",
//     "66cc992b8f897c9c18165e3e",
//     "66cc99bbce1195961b47de42",
//     "66cc9a1516d763510df9fa3d",
//     "66cc9a77d4c8c7a5b4122515",
//     "66cc9b0260084638446ea687",
// ],[
//     "66cc9b9442c51532b9431797",
//     "66cc9c7cf66d37a722f92c21",
//     "66cca32b642a3b80d4b6a512",
//     "66ccabb31f346dc30bd82bd9",
//     "66ccad250adf54596baf5705",
//     "66ccadc6a0ceb9a617ebc822",
//     "66ccae2e6374f95936cf14b1",
//     "66ccae9c0177873e05ba01d9",
//     "66ccaf08d857e525cc1c869c",
// ],[
//     "66ccaf860de725146edb439e",
//     "66ccaffc35b9228343b16800",
//     "66ccb0835d283271cbf4a61d",
//     "66ccb1050b57778fc74c1239",
//     "66ccb1836e371fe4a675c081",
//     "66ccb20a5feb9448b707c542",
//     "66ccb27bf856e736a17266bd",
// ],["66ccb2eddfb89ff2c79c59c9"]
// ];

// const names = [
//     "인문대학",
//     "자연과학대학",
//     "법과대학",
//     "사회과학대학",
//     "경제통상대학",
//     "경영대학",
//     "공과대학",
//     "IT대학",
//     "융합특성화자유전공학부"
// ]
// const idcollect = [];

// names.forEach(async(Name, index) => {
// // Map strings to Mongoose ObjectIds
// const objectIds = stringIds[index].map(id => new mongoose.Types.ObjectId(id));

// const obj = new mongoose.Types.ObjectId();
// idcollect.push(obj);
// const Dat = new Category({
//     _id: obj,
//     category_name: Name,
//     type: 1,
//     sub_category_list: objectIds
// });

// await Dat.save();
// });

// const v = await Category.findByIdAndUpdate("66a65c5d3a766b3cd29d4d00", {sub_category_list: idcollect}, {new: true});
// console.log(v);

//Function to read Excel file and convert to JSON

const l = ["글로벌미디어학부","전자정보공학부 전자공학전공","전자정보공학부 IT융합전공","컴퓨터학부","소프트웨어학부","AI융합학부","미디어경영학과","정보보호학과(계약학과)","화학공학과","신소재공학과","전기공학부","기계공학부","산업∙정보시스템공학과","건축학부 건축학부","건축학부 건축공학전공", "건축학부 건축학전공", "건축학부 실내건축전공"
,"경영학부","회계학과","벤처중소기업학과","금융학부","혁신경영학과","벤처경영학과","복지경영학과","회계세무학과","경제학과","글로벌통상학과","금융경제학과","국제무역학과","통상산업학과","사회복지학부","행정학부","정치외교학과","정보사회학과","언론홍보학과","평생교육학과"
,"법학과","국제법무학과","수학과","물리학과","화학과","정보·통계보험수리학과","의생명시스템학부"
,"기독교학과","국어국문학과","영어영문학과","독어독문학과","불어불문학과","중어중문학과","일어일문학과","철학과","사학과","예술창작학부 문예창작전공","예술창작학부 영화예술전공", "스포츠학부 스포츠학부","스포츠학부 생활체육전공","스포츠학부 스포츠사이언스전공","융합특성화자유전공학부"];

const readExcelFile = async (filePath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const jsonData = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Assuming the first row is the header
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                const header = worksheet.getRow(1).getCell(colNumber).value;
    
                rowData[header] = cell.value == null ? "" : cell.value;
            });
            jsonData.push(rowData);
        }
    });
    return jsonData;    
};

for(let i=0; i<2; i++){
    //const categoryData = readExcelFile("src/data/category.xlsx");
    const lowestCategoryData = await readExcelFile(`C:/Users/cathy/Downloads/과목3/${i}.xlsx`);//
    console.log(lowestCategoryData);
    const objID_list = [];
    const processedData = [];
    for(const i of lowestCategoryData){
        const objID = new mongoose.Types.ObjectId();
        objID_list.push(objID);
        processedData.push({
        _id:objID,
        ...i,
        type: 3,
        Rqna_list:[],
        Rpilgy_list:[],
        Rtest_list:[],
        Rhoney_list:[]
        });
    }

    await LowestCategory.insertMany(processedData)
        .then(()=>console.log("Successfully inserted lowest category data"))
        .catch(e=>console.error(e));
    
    const ress = await Category.findOneAndUpdate({category_name:"차세대반도체학과"}, {$push:{sub_category_list: objID_list}}, {new: true});
    console.log(ress);
    }

    // await Category.find({category_name:{$in:l}})
    //     .then(async(results)=>{
    //         for (const result of results) {
    //             result.sub_category_list = [result.sub_category_list];
    //             result.type = 2;
    //             console.log(result);
    //             await result.save();
    //         }
    //     })
    //     .catch(e=>console.error(e));
    //차세대반도체학과 66e4a951b989b32040e43877
// const categoryID = new mongoose.Types.ObjectId();
// await Category.create({
//     _id: categoryID,
//     category_name: "차세대반도체학과",
//     type: 2,
//     sub_category_list: [objID_list]
// });
// await Category.create({
//     _id: new mongoose.Types.ObjectId(),
//     category_name: "차세대반도체학과",
//     type: 1,
//     sub_category_list: [categoryID]
// });






