import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    category_name: { type: String },
    type: { type: Number },
    sub_category_list: [{ type: mongoose.SchemaTypes.ObjectId }]
});

const lowestCategorySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    category_name: { type: String },
    type: { type: Number },
    Rqna_list:[{ type: mongoose.SchemaTypes.ObjectId }],
    Rpilgy_list:[{ type: mongoose.SchemaTypes.ObjectId }],
    Rtest_list:[{ type: mongoose.SchemaTypes.ObjectId }],
    Rhoney_list:[{ type: mongoose.SchemaTypes.ObjectId }],
});

const Category = mongoose.model('Category', categorySchema, 'AllCategorized');
const LowestCategory = mongoose.model('LowestCategory', lowestCategorySchema, 'AllCategorized');

export { Category, LowestCategory };