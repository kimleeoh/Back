import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    confirmed: { type: Number, required: true },
    name: { type: String},
    POINT: { type: Number},
    Rbadge_list: [{ type: String}],
    Rcustom_brd: { type: mongoose.SchemaTypes.ObjectId},
    Rdoc: { type: mongoose.SchemaTypes.ObjectId},
    Rnotify_list: [{ type: mongoose.SchemaTypes.ObjectId}],
    Rscore: { type: mongoose.SchemaTypes.ObjectId},
    badge_img: { type: String},
    email: { type: String},
    exp: { type: Number},
    hakbu: { type: String},
    hakbun: { type: Number},
    level: { type: Number},
    password: { type: String},
    picked: { type: Number},
    profile_img: { type: String}
 });

 const User = mongoose.model('User', userSchema, 'User');

export { User };
