import mongoose from "mongoose";

const notifySchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    types: { type: Number },
    who_user: { type: String },
    Rdoc: { type: mongoose.SchemaTypes.ObjectId },
    Rdoc_title: { type: String },
    time: { type: Number, default: Date.now },
    checked: { type: Boolean },
});

notifySchema.index({ "time": -1 });

const Notify = mongoose.model("AllNotify", notifySchema, "AllNotify");

export { Notify };
