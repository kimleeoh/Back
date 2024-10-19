import mongoose from "mongoose";

const AllFilesSchema = new mongoose.Schema({
    file_link_list: { type: String, required: true }, // S3에 저장된 파일 링크
    // preview_img: { type: String }, // 미리보기 이미지 (선택 사항)
    // // file_type: { type: String, enum: ["image", "pdf"], required: true }, // 파일 타입
    // Ruser: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //     required: true,
    // }, // 파일 업로드한 사용자
    Rpurchase_list: [{ type: mongoose.Schema.Types.ObjectId }], // 구매한 사용자 목록
});

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
    now_category_list: [],
    Rcategory: { type: mongoose.SchemaTypes.ObjectId },
    title: { type: String },
    content: { type: String },
    preview_content: { type: String },
    point: { type: Number },
    img_list: [{ type: String }],
    likes: { type: Number },
    picked_index: { type: Number },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date, index: true },
    warn: { type: Number },
    warn_why_list: [{ type: Number }],
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
    warn_why_list: [{ type: Number }],
});

const tipsSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    Ruser: { type: mongoose.SchemaTypes.ObjectId },
    target: { type: String },
    now_category: { type: String },
    title: { type: String },
    content: { type: String },
    preview_img: { type: String },
    likes: { type: Number },
    purchase_price: { type: Number },
    Rfile: { type: mongoose.SchemaTypes.ObjectId },
    Rnotifyusers_list: [{ type: mongoose.SchemaTypes.ObjectId }],
    scrap: { type: Number },
    views: { type: Number },
    time: { type: Date, index: true },
    warn: { type: Number },
    warn_why_list : [{ type: Number }],
},{versionKey:false});

const qnaAnswerSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    content: { type: String, required: true },
    img_list: { type: [String] },
    likes: { type: Number },
    QNAcategory: { type: [String], required: true },
    Rqna: { type: mongoose.SchemaTypes.ObjectId },
    warn: { type: Number },
    warn_why_list: [{ type: Number }],
});

const AllFiles = mongoose.model("AllFiles", AllFilesSchema);
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
    AllFiles,
    QnaDocuments,
    PilgyDocuments,
    TestDocuments,
    HoneyDocuments,
    QnaAnswers,
    QnaAlready,
};
