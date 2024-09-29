import mongoose from "mongoose";

const qnaSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    restricted_type: { type: Boolean },
    user_main: { type: String },
    user_img: { type: String },

    Ruser: { type: mongoose.SchemaTypes.ObjectId },
    answer_list: [
        {
            Ranswer: { type: mongoose.SchemaTypes.ObjectId },
            Ruser: { type: mongoose.SchemaTypes.ObjectId },
            user_grade: { type: String },
        },
    ],
    now_category_list: [{ type: String }],
    title: { type: String },
    content: { type: String },
    preview_content: { type: String },
    img_list: [{ type: String }],
    likes: { type: Number },
    picked_index: { type: Number },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date, index: true },
    warn: { type: Number },
    warn_list: [{ type: Int16Array }],
});
const qnaAlreadySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    restricted_type: { type: Boolean },
    user_main: { type: String },
    user_img: { type: String },

    Ruser: { type: mongoose.SchemaTypes.ObjectId },
    answer_list: { type: Array },
    now_category_list: [{ type: String }],
    title: { type: String },
    content: { type: String },
    img: { type: String },
    likes: { type: Number },
    picked_index: { type: Number },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date },
    warn: { type: Number },
});

const tipsSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    Ruser: { type: mongoose.SchemaTypes.ObjectId },
    now_category: { type: String },
    title: { type: String },
    content: { type: String },
    preview_img: { type: String },
    likes: { type: Number },
    point: { type: Number },
    Rfile: { type: mongoose.SchemaTypes.ObjectId },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date, index: true },
    warn: { type: Number },
});

const qnaAnswerSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    content: { type: String, required: true },
    img_list: { type: [String] },
    likes: { type: Number },
    QNAtitle: { type: String, required: true },
    QNAcategory: { type: [String], required: true },
    Rqna: { type: mongoose.SchemaTypes.ObjectId },
    warn: { type: Number },
});

const QnaAnswers = mongoose.model("QNA", qnaAnswerSchema, "QnaAnswers");
const QnaAlready = mongoose.model(
    "QnaAlready",
    qnaAlreadySchema,
    "QnaDocuments"
);

const QnaDocuments = mongoose.model("QnaDocuments", qnaSchema, "QnaDocuments");
const PilgyDocuments = mongoose.model(
    "PilgyDocuments",
    tipsSchema,
    "PilgyDocuments"
);
const TestDocuments = mongoose.model(
    "TestDocuments",
    tipsSchema,
    "TestDocuments"
);
const HoneyDocuments = mongoose.model(
    "HoneyDocuments",
    tipsSchema,
    "HoneyDocuments"
);

export {
    QnaDocuments,
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
    QnaAnswers,
    QnaAlready,
};
