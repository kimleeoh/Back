import mongoose from 'mongoose';

const qnaSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId,required: true },
    restricted_type: { type:Number }, 
    user_main: { type: String },
    user_img: { type: String },
    user_badge_img: { type: String },
    Ruser: { type: mongoose.SchemaTypes.ObjectId },
    answer_list: [{ 
        Ranswer: { type: mongoose.SchemaTypes.ObjectId },
        Ruser: { type: mongoose.SchemaTypes.ObjectId },
        user_grade: { type: String }
    }],
    now_category_list: [{ type: String }],
    title: { type: String },
    content: { type: String },
    img: { type: String },
    like: { type: Number },
    picked_index: { type: Number },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date },
    warn: { type: Number }
});

const tipsSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId,required: true },
    Ruser: { type: mongoose.SchemaTypes.ObjectId },
    now_category: { type: String },
    title: { type: String },
    content: { type: String },
    preview_img: { type: String },
    like: { type: Number },
    point: { type: Number },
    Rfile: { type: mongoose.SchemaTypes.ObjectId },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date },
    warn: { type: Number }
});

const qnaAnswerSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId,required: true},
    content: { type: String, required: true},
    img_list: {type: [String]},
    like: {type: Number},
    QNAtitle: {type: String,required: true},
    QNAcategory: {type: [String],required: true},
    Rqna: {type: mongoose.SchemaTypes.ObjectId}
});

const QnaAnswers = mongoose.model('QNA', qnaAnswerSchema, 'QnaAnswers');

const QnaDocuments = mongoose.model('QnaDocuments', qnaSchema, 'QnaDocuments');
const PilgyDocuments = mongoose.model('PilgyDocuments', tipsSchema, 'PilgyDocuments');
const TestDocuments = mongoose.model('TestDocuments', tipsSchema, 'TestDocuments');
const HoneyDocuments = mongoose.model('HoneyDocuments', tipsSchema, 'HoneyDocuments');

export { QnaDocuments, PilgyDocuments, TestDocuments, HoneyDocuments, QnaAnswers };