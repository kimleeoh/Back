import mongoose from 'mongoose';

const qnaSchema = new mongoose.Schema({
    _id: { type: mongoose.Types.ObjectId,required: true },
    restricted_type: { type:Number }, 
    user_main: { type: String },
    user_img: { type: String },
    user_badge_img: { type: String },
    Ruser: { type: mongoose.Types.ObjectId },
    answer_list: [{ 
        Ranswer: { type: mongoose.Types.ObjectId },
        Ruser: { type: mongoose.Types.ObjectId },
        user_grade: { type: String }
    }],
    now_category_list: [{ type: String }],
    title: { type: String },
    content: { type: String },
    img: { type: String },
    like: { type: Number },
    picked_index: { type: Number },
    Rnotifyusers_list: [{ type: mongoose.Types.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date },
    warn: { type: Number }
});

const tipsSchema = new mongoose.Schema({
    _id: { type: mongoose.Types.ObjectId,required: true },
    Ruser: { type: mongoose.Types.ObjectId },
    now_category: { type: String },
    title: { type: String },
    content: { type: String },
    preview_img: { type: String },
    like: { type: Number },
    point: { type: Number },
    Rfile: { type: mongoose.Types.ObjectId },
    Rnotifyusers_list: [{ type: mongoose.Types.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date },
    warn: { type: Number }
});

const QnaDocuments = mongoose.model('QnaDocuments', qnaSchema, 'QnaDocuments');

const PilgyDocuments = mongoose.model('PilgyDocuments', tipsSchema, 'PilgyDocuments');
const TestDocuments = mongoose.model('TestDocuments', tipsSchema, 'TestDocuments');
const HoneyDocuments = mongoose.model('HoneyDocuments', tipsSchema, 'HoneyDocuments');

export { QnaDocuments, PilgyDocuments, TestDocuments, HoneyDocuments };