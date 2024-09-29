import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    b_img: { type: String },
    b_name: { type: String },
});

const Badge = mongoose.model("Badge", badgeSchema, "Badge");

export { Badge };
