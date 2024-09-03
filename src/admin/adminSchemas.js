import mongoose from 'mongoose';


const adminLoginSchema = new mongoose.Schema({
    // Define your schema fields here
    _id: {
        type: String,
        required: true
    },
    Admins: [{
        id: {
            type: String,
            required: true,
            unique: true
        },
        pw: {
            type: String,
            required: true
        }
    }]
});

const adminConfirmSchema = new mongoose.Schema({
    // Define your schema fields here
    _id: {
        type: String,
        required: true
    },
    unconfirmed_list: [{
        Ruser: {type:mongoose.Types.ObjectId, ref: 'User'},
        confirm_img: {type:String}
    }]
});

const adminWarnSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    warn_list: [{
        Rdoc: {type:mongoose.Types.ObjectId},
        count: {type:Number},
        why_list: [{type:Number}]
    }]
});

const adminUsersSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    out_user_list: [{
        Ruser: {type:mongoose.Types.ObjectId},
        reason: {type:Number}
    }],
    all_user_sum: {
        type: Number
    }
});


const AdminLogin = mongoose.model('AdminLogin', adminLoginSchema, 'Admin');
const AdminConfirm = mongoose.model('AdminConfirm', adminConfirmSchema, 'Admin');
const AdminWarn = mongoose.model('AdminWarn', adminWarnSchema, 'Admin');
const AdminUsers = mongoose.model('AdminUsers', adminUsersSchema, 'Admin');

export {AdminConfirm, AdminLogin, AdminWarn, AdminUsers};
