//추후 이거 통해서 몽고디비에 과목 관련 데이터 넣을 예정

import mongoose from "mongoose";
import connectDB from "./mongoDBconnect.js";
import ExcelJS from "exceljs";
import { Category, LowestCategory } from "../schemas/category.js";
import fs from "fs";

await connectDB();

// await Category.deleteMany({type:3})
//       .then(()=>console.log("Successfully deleted"));

// await Category.find({ type: 2 }).then(async (results) => {
//     for(const result of results){
//         result.sub_category_list = [];
//         await result.save();
//         // if(result.sub_category_list.length>2){
//         //     result.sub_category_list = result.sub_category_list.slice(-3,-1);
//         //     console.log(result.sub_category_list);
//         //     await result.save();
//         // }
//     }
// });
console.log("done");
// await Category.find({type:2})
//     .then((result)=>result.forEach(async(category)=>{
//         // console.log(category);
//         category.sub_category_list = [];
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
const bigs = [
    "15이전",
    "16-18",
    "19",
    "20-22",
    "23이후",
    "기독교과목",
    "숭실사이버대과목"
]
const names = [
    [
        ["문학과예술(융합-인문)",[]],
        ["생활과건강(실용-생활)",[]],
        ["세계의문화와국제관계(핵심-창의)",[]],
        ["세계의언어(핵심-창의)",[]],
        ["역사와철학(융합-인문)",[]],
        ["인간과사회(융합-사회)",[]],
        ["인성과리더십(핵심-창의)",[]],
        ["자연과학과수리(융합-자연)",[]],
        ["정보와기술(융합-자연)",[]],
        ["정치와경제(융합-사회)",[]],
        ["창의성과의사소통능력(핵심-창의)",[]],
        ["학문과진로탐색(실용-생활)",[]]
    ],
    [
        ["균형교양(사회과학-문화및문명)",[]],
        ["균형교양(사회과학-사회/정치/경제)",[]],
        ["균형교양(인문학-문학/어학/예술)",[]],
        ["균형교양(인문학-역사)",[]],
        ["균형교양(인문학-철학/사상)",[]],
        ["균형교양(자연과학-자연과학)",[]],
        ["기초역량(과학정보기술-과학)",[]],
        ["기초역량(과학정보기술-정보기술)",[]],
        ["기초역량(국제어문-고전어문)",[]],
        ["기초역량(국제어문-국제어)",[]],
        ["기초역량(국제어문-영어)",[]],
        ["기초역량(사고력-창의및융합적사고)",[]],
        ["기초역량(한국어의사소통-의사소통)",[]],
        ["기초역량(한국어의사소통-읽기와쓰기)",[]],
        ["숭실품성(리더십-리더십이론및실천)",[]],
        ["숭실품성(리더십-통일리더십)",[]],
        ["숭실품성(인성-가치관및윤리교육)",[]],
        ["숭실품성(인성-공동체인성교육)",[]],
        ["숭실품성(인성-종교가치인성교육)",[]],
        ["실용교양(개인과가족생활)",[]],
        ["실용교양(경제경영)",[]],
        ["실용교양(공공생활)",[]],
        ["실용교양(기술생활)",[]],
        ["실용교양(자기개발과진로탐색)",[]],
    ],
    [
        ["균형교양-사회과학(사회/역사)",[]],
        ["균형교양-인문학(인간/문화/사고력)",[]],
        ["균형교양-자연/공학(자연/과학/기술)",[]],
        ["기초역량-한국어의사소통과국제어문",[]],
        ["숭실품성-인성과리더십",[]]
    ],
    [
        ["공동체/리더십,숭실품성-인성과리더십",[]],
        ["공동체/리더십,숭실품성-자기개발과진로탐색",[]],
        ["의사소통/글로벌,기초역량-국제어문",[]],
        ["의사소통/글로벌,기초역량-한국어의사소통",[]],
        ["창의/융합,균형교양-문학·예술",[]],
        ["창의/융합,균형교양-사회·문화·심리",[]],
        ["창의/융합,균형교양-역사·철학·종교",[]],
        ["창의/융합,균형교양-자연과학·공학·기술",[]],
        ["창의/융합,균형교양-정치·경제·경영",[]]
    ],
    [
        ["과학·기술",[]],
        ["문화·예술",[]],
        ["사회·정치·경제",[]],
        ["인간·언어",[]],
        ["자기개발·진로탐색",[]]
    ],
    [
        ["기독교과목",[]],
    ],
    [
        ["숭실사이버대과목",[]]
    ]
];

const gs = [
    "(외국인을위한)대학글쓰기",
    "Academic and Professional English 1",
    "Academic and Professional English 2",
    "Academic and Professional English 2(고급)",
    "기업가정신과행동",
    "대학한국어1",
    "대학한국어2",
    "비전채플",
    "미디어사회와비평적글쓰기",
    "비판적사고와학술적글쓰기",
    "기술혁신사회와과학기술글쓰기",
    "소그룹채플",
    "외국인신입생세미나",
    "인류문명과기독교",
    "인문학과성서",
    "현대사회이슈와기독교",
    "고전읽기와상상력",
    "디지털미래세계와소통",
    "융합독서디베이트",
    "인문적상상력과데이터기반토론",
    "컴퓨팅적사고",
    "학문목적한국어5",
    "학문목적한국어6",
    "한반도평화와통일",
    "AI와데이터기초",
    "AI와머신러닝",
    "AI개발과실전",
    "CTE for IT,Engineering&Natura",
    "CTE for Liberal Arts&Humanit",
    "CTE for Social Science & Busin",
    "글로벌도시이해",
    "글로벌시민과국제기구",
    "세계화와글로벌이슈"
]
const readExcelFile = async (filePath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const jsonData = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            // Assuming the first row is the header
            const rowData = {};
            row.eachCell((cell, colNumber) => {
                if (colNumber > 0) {
                const header = worksheet.getRow(1).getCell(colNumber).value;

                rowData[header] = cell.value == null ? "" : cell.value;
                }
            });
            jsonData.push(rowData);
        }
    });
    return jsonData;
};

// for (let g =0; g<33; g++){
//     const lowestCategoryData = await readExcelFile(
//                 `C:/Users/cathy/Downloads/교필/${g}.xlsx`
//             ); 
//             console.log(lowestCategoryData);
//             let processedData = [];
//             let ids=[];
//             await Category.findOne({category_name: gs[g]}).then(async(result)=>{
//                 // await LowestCategory.deleteMany({_id : {$in : result.sub_category_list}}).then(()=>console.log("deleted"));
//                 // result.sub_category_list = [];
//                 // await result.save();
//                 for (const v of lowestCategoryData) {
//                     const objID = new mongoose.Types.ObjectId();
//                     // await Category.findOneAndDelete({category_name: v.category_name}).then(()=>console.log("deleted"));
//                     ids.push(objID);
//                     const nn = result.type+1;
//                     processedData.push({
//                         _id: objID,
//                         ...v,
//                         type: nn,
//                         Rqna_list: [],
//                         Rpilgy_list: [],
//                         Rtest_list: [],
//                         Rhoney_list: [],
//                     });
//                 }
            
//                 await LowestCategory.insertMany(processedData)
//                     .then(() => console.log("Successfully inserted lowest category data"))
//                     .catch((e) => console.error(e));

//                 result.sub_category_list = ids;
//                 await result.save();
//             });
            
//         }
        
// for(const f of names){
//     for(const x of f){
//         Category.find({category_name: x[0]}).then(async(result)=>{
//             if(result.length>1){
//                 result.pop();
//                 const saveonly = result.map(doc => doc._id);
//                 Category.deleteMany({_id: {$in : saveonly}}).then(()=>console.log("deleted"));
//             }
         
//         });
//     }
    
//  }
// for (let i = 0; i < 5; i++) {
//     //const categoryData = readExcelFile("src/data/category.xlsx");
//     const lowestCategoryData = await readExcelFile(
//         `C:/Users/cathy/Downloads/교선/${i}.xlsx`
//     ); 
//     console.log(lowestCategoryData);
    
//     const processedData = [];
//     for (const v of lowestCategoryData) {
//         await Category.findOneAndDelete({category_name: v.category_name}).then(()=>console.log("deleted"));
//     }
// }

// for(const big of bigs){
    
//     names.forEach(async(Name, index) => {
//     // Map strings to Mongoose ObjectIds
//     //const objectIds = stringIds[index].map(id => new mongoose.Types.ObjectId(id));
    
//     for (const v of Name) {
//         await Category.deleteMany({category_name: v[0]}).then(()=>console.log("deleted"));
//     }
//     });
//     await Category.findOneAndUpdate({category_name: big}, {sub_category_list: []}, {new: true});
// }
// console.log("all set to go");

// for (let i = 0; i < 5; i++) {
//     //const categoryData = readExcelFile("src/data/category.xlsx");
//     const lowestCategoryData = await readExcelFile(
//         `C:/Users/cathy/Downloads/교선/${i}.xlsx`
//     ); 
//     console.log(lowestCategoryData);
    
//     const processedData = [];
//     for (const v of lowestCategoryData) {
//         // const objID = new mongoose.Types.ObjectId();
//         const objID = await LowestCategory.findOne({category_name: v.category_name}, {_id: 1});
//         console.log("찾은놈:",objID);
//         let seeCat = v.교과영역;
//         seeCat = seeCat.split('.').map(category => category.trim()).filter(category => category.length > 0);
//         for(const cat of seeCat){
//             let qit = false;
//             for(const name of names){
//                 for(const x of name){
//                     if(x[0] == cat){
//                         x[1].push(objID._id);
//                         qit = true;
//                         break;
//                     }
//                 }
//                 if(qit)break;
//             }
//         }
        
        

//         const { 교과영역, ...w } = v;
        
        
        // processedData.push({
        //     _id: objID,
        //     ...w,
        //     type: 4,
        //     Rqna_list: [],
        //     Rpilgy_list: [],
        //     Rtest_list: [],
        //     Rhoney_list: [],
        // });
  //  }

    // await LowestCategory.insertMany(processedData)
    //     .then(() => console.log("Successfully inserted lowest category data"))
    //     .catch((e) => console.error(e));
//}

// names.forEach(async(Name, index) => {
// // Map strings to Mongoose ObjectIds
// //const objectIds = stringIds[index].map(id => new mongoose.Types.ObjectId(id));

// const idcollect = [];
// for (const v of Name) {
//     console.log(v);
//     await Category.findOne({category_name: v[0]}).then(async(result)=>{
//         console.log(result);
//         result.sub_category_list = v[1];
//         console.log(result);
//         await result.save();
//     });}
    
        
       
//     // const csd = await Category.findOneAndUpdate({category_name: bigs[index]}, {sub_category_list: idcollect}, {new: true});
//     // console.log(csd);
// }


// const obj = new mongoose.Types.ObjectId();
// idcollect.push(obj);
// const Dat = new Category({
//     _id: obj,
//     category_name: v[0],
//     type: 3,
    
// });

// await Dat.save();}
// // const csd = await Category.findOneAndUpdate({category_name: bigs[index]}, {sub_category_list: idcollect}, {new: true});
// console.log(csd);
//);






// const v = await Category.findByIdAndUpdate("66a65c5d3a766b3cd29d4d00", {sub_category_list: idcollect}, {new: true});
// console.log(v);

//Function to read Excel file and convert to JSON

// const l = [
//     "글로벌미디어학부",
//     "전자정보공학부 전자공학전공",
//     "전자정보공학부 IT융합전공",
//     "컴퓨터학부",
//     "소프트웨어학부",
//     "AI융합학부",
//     "미디어경영학과",
//     "정보보호학과(계약학과)",
//     "화학공학과",
//     "신소재공학과",
//     "전기공학부",
//     "기계공학부",
//     "산업∙정보시스템공학과",
//     "건축학부 건축학부",
//     "건축학부 건축공학전공",
//     "건축학부 건축학전공",
//     "건축학부 실내건축전공",
//     "경영학부",
//     "회계학과",
//     "벤처중소기업학과",
//     "금융학부",
//     "혁신경영학과",
//     "벤처경영학과",
//     "복지경영학과",
//     "회계세무학과",
//     "경제학과",
//     "글로벌통상학과",
//     "금융경제학과",
//     "국제무역학과",
//     "통상산업학과",
//     "사회복지학부",
//     "행정학부",
//     "정치외교학과",
//     "정보사회학과",
//     "언론홍보학과",
//     "평생교육학과",
//     "법학과",
//     "국제법무학과",
//     "수학과",
//     "물리학과",
//     "화학과",
//     "정보∙통계보험수리학과",
//     "의생명시스템학부",
//     "기독교학과",
//     "국어국문학과",
//     "영어영문학과",
//     "독어독문학과",
//     "불어불문학과",
//     "중어중문학과",
//     "일어일문학과",
//     "철학과",
//     "사학과",
//     "예술창작학부 문예창작전공",
//     "예술창작학부 영화예술전공",
//     "스포츠학부 스포츠학부",
//     "스포츠학부 생활체육전공",
//     "스포츠학부 스포츠사이언스전공",
//     "융합특성화자유전공학부",
// ];

// const readExcelFile = async (filePath) => {
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(filePath);
//     const worksheet = workbook.worksheets[0];
//     const jsonData = [];
//     worksheet.eachRow((row, rowNumber) => {
//         if (rowNumber > 1) {
//             // Assuming the first row is the header
//             const rowData = {};
//             row.eachCell((cell, colNumber) => {
//                 if (colNumber === 0) {continue;}
//                 const header = worksheet.getRow(1).getCell(colNumber).value;

//                 rowData[header] = cell.value == null ? "" : cell.value;
//             });
//             jsonData.push(rowData);
//         }
//     });
//     return jsonData;
// };

for (let i = 0; i < 2; i++) {
    //const categoryData = readExcelFile("src/data/category.xlsx");
    const lowestCategoryData = await readExcelFile(
        `C:/Users/cathy/Downloads/교직/${i}.xlsx`
    ); 
    console.log(lowestCategoryData);
    const objID_list = [];
    const processedData = [];
    for (const v of lowestCategoryData) {
        const objID = new mongoose.Types.ObjectId();
        objID_list.push(objID);
        processedData.push({
            _id: objID,
            ...v,
            type: 1,
            Rqna_list: [],
            Rpilgy_list: [],
            Rtest_list: [],
            Rhoney_list: [],
        });
    }

    await LowestCategory.insertMany(processedData)
        .then(() => console.log("Successfully inserted lowest category data"))
        .catch((e) => console.error(e));
    const ress = await Category.findOneAndUpdate(
        { category_name: "교직" },
        { $push: { sub_category_list: objID_list } },
        { new: true }
    );
    if(ress==null){
        await Category.findOneAndUpdate(
            { category_name: "교직" },
            { $push: { sub_category_list: objID_list } },
            { new: true }
        );
    }
    console.log(ress);
}


// await Category.find({type:2})
//     .then(async(results)=>{
//         for (const result of results) {
//             for(let i=0; i<2; i++){
//                 const unique = new Map();
//                 let objID_list = [];
//                 console.log(result);
//                 if(result.sub_category_list.length>2|| result.sub_category_list.length==0)continue;
//                 for(const item of result.sub_category_list[i]){
//                 const r = await LowestCategory.findById(item, {category_name: 1, professor: 1, sub_student: 1});
//                 console.log(r);
//                 if(r === null){continue;}
//                 if (unique.has(r.category_name)) {
//                     const l = unique.get(r.category_name);
//                     if(l[0] === r.professor && l[1] === r.sub_student){
//                         await LowestCategory.deleteOne({_id: item})
//                         console.log("deleted");
//                     }else{
//                         objID_list.push(item);
//                         let gg = [];
//                         gg.push(r.professor);
//                         gg.push(r.sub_student);
//                         unique.set(r.category_name, gg);
//                     }
//                 }else{
//                     unique.set(r.category_name, [r.professor, r.sub_student]);
//                     objID_list.push(item);
//                 }
//             }
//             result.sub_category_list[i] = objID_list;
//         }
//         console.log(result.sub_category_list);
//         await result.save();
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