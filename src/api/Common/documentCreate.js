const Qna = require("../models/Qna");
const Tips = require("../models/Tips");
const AllFiles = require("../models/AllFiles");
const mongoose = require("mongoose");

// Qna 문서 생성
async function createQnaDocument(data) {
  const qna = new Qna(data);
  await qna.save();
  return qna;
}

// Tips 문서 생성
async function createTipsDocument(data) {
  const tips = new Tips(data);
  await tips.save();
  return tips;
}

// AllFiles 문서 생성
async function createAllFilesDocument(data) {
  const allFiles = new AllFiles(data);
  await allFiles.save();
  return allFiles;
}

// 특정 문서 조회
async function findDocumentById(collection, id) {
  return await collection.findById(id);
}

module.exports = {
  createQnaDocument,
  createTipsDocument,
  createAllFilesDocument,
  findDocumentById,
};
