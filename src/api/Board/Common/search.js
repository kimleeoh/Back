import { Category, CommonCategory } from "../../../schemas/category.js";
import {PilgyDocuments, HoneyDocuments, TestDocuments, QnaDocuments} from "../../../schemas/docs.js";
import { User } from "../../../schemas/user.js";

const handleBoardSearch = async (req, res) => {
    const { keyword } = req.query;
    try {
        // 검색어가 없을 경우
        if (!keyword) {
            return res.status(400).send({ message: "검색어를 입력해주세요." });
        }
        if(keyword.length < 2){
            return res.status(400).send({ message: "2자 이상의 검색어를 입력해주세요." });
        }

        console.log("keyword: ", keyword);

        // category_type에 따라 적절한 Documents 스키마 선택
        const documentSchema = [PilgyDocuments, HoneyDocuments, TestDocuments, QnaDocuments];
        const stringDocumentSchema = ["PilgyDocuments", "HoneyDocuments", "TestDocuments", "QnaDocuments"];
        // 문서 정보 가져오기
        const searchResults = [];
        for(let i=0; i<documentSchema.length; i++){
            const documents = documentSchema[i];
            const r = await documents.find({
                title: { $regex: keyword, $options: "i" },
            }).lean();

            console.log("r: ", r);
            if(r.length === 0){continue;}
            const processedR = await Promise.all(r.map(async (doc) => {
                doc.TYPE = stringDocumentSchema[i];
                if (doc.TYPE === "QnaDocuments") {
                    const detailUser = await User.findById(doc.Ruser, { _id: 1, name: 1, hakbu: 1 }).lean();
                    doc.Ruser = detailUser;
                }
                return doc;
            }));
            searchResults.push(...processedR);
        }

        console.log("searchResults: ", searchResults);

        if(searchResults.length === 0){return res.status(201).send({message: "Document not found"});}

        searchResults.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        return res.status(200).send({ searchResults });
    } catch (error) {
        console.error("Error checking document:", error);
        res.status(500).send("Server Error");
    }
}

const handleCategorySearch = async (req, res) => {
    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).send({ message: "No keyword" });
    }
    if(keyword.length < 2){
        return res.status(400).send({ message: "Keyword is too short" });
    }

    try {
        // category_type에 따라 적절한 Documents 스키마 선택
        const searchResults = await CommonCategory.find({category_name: { $regex: keyword, $options: "i" }}).lean();

        if(searchResults.length === 0){return res.status(201).send({message: "Document not found"});}

        return res.status(200).send({ searchResults });
    } catch (error) {
        console.error("Error finding category:", error);
        res.status(500).send("Server Error");
    }
}

export { handleBoardSearch, handleCategorySearch };