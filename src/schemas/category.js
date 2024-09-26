import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    category_name: { type: String },
    type: { type: Number },
    sub_category_list: []
},  { versionKey: false });

const lowestCategorySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    category_name: { type: String },
    professor: { type: String },
    timeIcredit: { type: String},
    sub_student: { type: String },  
    type: { type: Number },
    Rqna_list:[{ type: mongoose.SchemaTypes.ObjectId }],
    Rpilgy_list:[{ type: mongoose.SchemaTypes.ObjectId }],
    Rtest_list:[{ type: mongoose.SchemaTypes.ObjectId }],
    Rhoney_list:[{ type: mongoose.SchemaTypes.ObjectId }],
},  { versionKey: false });

const commonCategorySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    category_name: { type: String },
    type: { type: Number },
    sub_category_list: [],
    professor: { type: String },
    timeIcredit: { type: String},
    sub_student: { type: String },  
    Rqna_list:[],
    Rpilgy_list:[],
    Rtest_list:[],
    Rhoney_list:[],
},  { versionKey: false }); 

const Category = mongoose.model('Category', categorySchema, 'AllCategorized');
const LowestCategory = mongoose.model('LowestCategory', lowestCategorySchema, 'AllCategorized');
const CommonCategory = mongoose.model('CommonCategory', commonCategorySchema, 'AllCategorized');

export { Category, LowestCategory, CommonCategory };