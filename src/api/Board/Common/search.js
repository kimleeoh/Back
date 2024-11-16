import { Category, CommonCategory } from "../../../schemas/category.js";
import {PilgyDocuments, HoneyDocuments, TestDocuments, QnaDocuments} from "../../../schemas/docs.js";

const handleBoardSearch = async (req, res) => {
    const { keyword } = req.query;
    try {
        // 검색어가 없을 경우
        if (!keyword) {
            return res.status(400).send({ message: "No keyword" });
        }
        if(keyword.length < 2){
            return res.status(400).send({ message: "Keyword is too short" });
        }

        // category_type에 따라 적절한 Documents 스키마 선택
        const documentSchema = [PilgyDocuments, HoneyDocuments, TestDocuments, QnaDocuments];
        const stringDocumentSchema = ["PilgyDocuments", "HoneyDocuments", "TestDocuments", "QnaDocuments"];
        // 문서 정보 가져오기
        const searchResults = [];
        for(let documents of documentSchema){
            const r = await documents.find({
                title: { $regex: keyword, $options: "i" },
            }).lean();
            const processedR = r.map((doc, idx) => {
                doc.TYPE = stringDocumentSchema[idx];
            });
            searchResults.push(...processedR);
        }

        if(searchResults.length === 0){return res.status(201).send({message: "Document not found"});}

        searchResults.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        return res.status(200).send({ searchResults });
    } catch (error) {
        console.error("Error checking document:", error);
        res.status(500).    send("Server Error");
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