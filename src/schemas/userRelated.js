import mongoose from "mongoose";

const customBoardSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    Renrolled_list: { type: [mongoose.SchemaTypes.ObjectId] },
    Rbookmark_list: { type: [mongoose.SchemaTypes.ObjectId] },
    Rlistened_list: { type: [mongoose.SchemaTypes.ObjectId] },
}, {versionKey: false});

const scoreSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    Ruser: { type: mongoose.SchemaTypes.ObjectId, required: true },
    is_show : { type: Boolean },
    overA_subject_list: { type: [String] },
    overA_type_list: { type: [Number] },
    semester_list: [{
        confirmed: { type: Number },
        filled: { type: Boolean },
        Rcategory_list: { type: [mongoose.SchemaTypes.ObjectId] }, // 참조할 과목 id 
        subject_list: { type: [String] }, // 과목이름
        credit_list: { type: [Boolean] }, //과목별인증여부
        grade_list: { type: [Number] },
        ismajor_list: { type: [Boolean] },
        is_show_list: { type: [Boolean] },
    }],
});

const userDocSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    totalLike: { type: Number },
    written: { type: Number },
    Rpilgy_list: { type: [mongoose.SchemaTypes.ObjectId] },
    Rhoney_list: { type: [mongoose.SchemaTypes.ObjectId] },
    Rtest_list: { type: [mongoose.SchemaTypes.ObjectId] },
    Rqna_list: { type: [mongoose.SchemaTypes.ObjectId] },
    Rreply_list: { type: [mongoose.SchemaTypes.ObjectId] },
    RmyLike_list: {
        Rqna_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rpilgy_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rhoney_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rtest_list: { type: [mongoose.SchemaTypes.ObjectId] },
    },
    RmyScrap_list: {
        Rqna_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rpilgy_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rhoney_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rtest_list: { type: [mongoose.SchemaTypes.ObjectId] },
    },
    Rnotify_list: { type: [mongoose.SchemaTypes.ObjectId] },
    RmyUnlike_list: {
        Rqna_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rpilgy_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rhoney_list: { type: [mongoose.SchemaTypes.ObjectId] },
        Rtest_list: { type: [mongoose.SchemaTypes.ObjectId] },
    },
    final_views: { type: Number },
    final_scraped: { type: Number },
    final_liked: { type: Number },
    last_up_time: { type: Date },
});

const CustomBoardView = mongoose.model(
    "CustomBoardView",
    customBoardSchema,
    "CustomBoardView"
);
const Score = mongoose.model("Score", scoreSchema, "Score");
const UserDocs = mongoose.model("UserDocs", userDocSchema, "UserDocs");

export { CustomBoardView, Score, UserDocs };
