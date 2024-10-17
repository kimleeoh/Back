import { ADMIN_AUTH_CODE } from './adminAuthcodeSafer.js';
import { AdminConfirm, AdminWarn, AdminUsers, AdminScore } from './adminSchemas.js';
import redisHandler from '../config/redisHandler.js';
import {User} from '../schemas/user.js';
import mongoose, {SchemaTypes} from 'mongoose';
import s3Handler from '../config/s3Handler.js';
import {CustomBoardView, UserDocs, Score} from '../schemas/userRelated.js';
import { AllFiles, PilgyDocuments, QnaAnswers, QnaDocuments, HoneyDocuments, TestDocuments } from '../schemas/docs.js';

// router.get('/', async (req, res) => {
// });

const handleAdminHome = async (req, res) => {
    if(req.session.user!=undefined){
        console.log(req.session.user);
        res.redirect(301,'/admin/online');
    }else{
        res.render('home.ejs', {loginStatus:''});
    }
}

// router.get('/admin/online', async (req, res) => {
// });

const handleAdminOnline = async (req, res) => {
    if (req.session.user && req.session.user.authCode && req.session.user.authCode === ADMIN_AUTH_CODE.get()) {
        console.log("yup");
        const redisClient = redisHandler.getRedisClient();

        try {
            const result = await AdminConfirm.findOne({ _id: 0 });
            console.log(result);

            const warn = await AdminWarn.findOne({ _id: 1 });
            const users = await AdminUsers.findOne({ _id: 2 });
            const scores = await AdminScore.findOne({ _id: 4 });

            const members = await redisClient.sMembers('logged_in_admins');
            const selecte = await redisClient.sMembers('selected');

            console.log("inits:", selecte);
            res.render('admin.ejs', {
                presentAdmin: members,
                waitingUser: result.unconfirmed_list,
                selected: selecte,
                warned: warn.warn_list,
                quitUser: users.out_user_list,
                allUser: users.all_user_sum,
                scored: scores.score_list
            });
        } catch (err) {
            console.error('Error:', err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(401).send("Unauthorized");
    }
};

// router.post('/admin/redis', async (req, res) => {
// });

const handleAdminRedis = async (req, res) => {
    const redisClient = redisHandler.getRedisClient();
    
    if(req.body.type=="selected"){
        redisClient.sAdd('selected', req.body.index)
        .then(() => {res.status(200).send('Success');})
        .catch((err) => {
            console.error('Redis error:', err);
            res.status(500).send('Internal Server Error-Redis');
        });
    }else if(req.body.type=="finished"){
        redisClient.sRem('selected', req.body.index)
        .then(() => {res.status(200).send('Success');})
        .catch((err) => {
            console.error('Redis error:', err);
            res.status(500).send('Internal Server Error-Redis');
        });
    }else if(req.body.type=="current"){
        redisClient.sMembers('logged_in_admins')
        .then((members) => {res.status(200).send(members);})
        .catch((err) => {
              console.error('Redis error:', err);
              res.status(500).send('Internal Server Error-Redis');
        });
    }
}

// router.put('/admin/online/newData', async (req, res) => { 
// });

const handleAdminNewData = (req, res) => {
    try{
        io.emit('newData');
        res.status(200).send({message:'Success'});
    }catch(e){
        res.status(500).send(e);
    }
}

// router.post('/admin/mongoose', async (req, res) => {
// });
const handleAdminMongoose = async (req, res) => {
    const idd = new mongoose.Types.ObjectId(req.body.id, "hex");
    console.log(idd);

    const removeFromList = async (model, listName, userId) => {
        await model.updateOne(
            { _id: "0" },
            { $pull: { [listName]: { Ruser: userId } } }
        );
        console.log("Deleted the complete request from MongoDB");
    };

    const updateUserConfirmation = async (userId, confirmationStatus) => {
        return User.findOneAndUpdate({ _id: userId }, { confirmed: confirmationStatus }, { new: true });
    };

    const createAndSaveDocuments = async (result) => {
        const myCustom = new CustomBoardView({
            _id: result.Rcustom_brd,
            Renrolled_list: [],
            Rbookmark_list: [],
            Rlistened_list: [],
        });

        const myDoc = new UserDocs({
            _id: result.Rdoc,
            written: 0,
            totalLike: 0,
            Rpilgy_list: [],
            Rhoney_list: [],
            Rtest_list: [],
            Rqna_list: [],
            Rreply_list: [],
            RmyLike: {
                Rqna_list: [],
                Rpilgy_list: [],
                Rhoney_list: [],
                Rtest_list: [],
            },
            RmyScrap_list: {
                Rqna_list: [],
                Rpilgy_list: [],
                Rhoney_list: [],
                Rtest_list: [],
            },
            Rnotify_list: [],
            final_views: 0,
            final_scraped: 0,
            final_liked: 0,
            last_up_time: new Date(),
        });

        const defaultObject = {
            confirmed: 1,
            filled: false,
            Rcategory_list: [],
            subject_list: [],
            credit_list: [],
            grade_list: [],
            ismajor_list: [],
            is_show_list: [],
        };

        const semesterArray = Array.from({ length: 8 }, () => ({ ...defaultObject }));

        const myScore = new Score({
            _id: result.Rscore,
            Ruser: result._id,
            overA_subject_list: [],
            overA_type_list: [],
            semester_list: semesterArray,
        });

        await myCustom.save();
        await myDoc.save();
        await myScore.save();
    };

    const handleConfirmU = async () => {
        await removeFromList(AdminConfirm, "unconfirmed_list", idd);

        if (req.body.type === "confirm") {
            try {
                const result = await updateUserConfirmation(idd, 2);
                await createAndSaveDocuments(result);
                if (result.confirmed === 2) res.status(200).send("Success : set to confirmed");
            } catch (err) {
                console.error(err);
                res.status(500).send("Internal Server Error-mongoose");
            }
        } else if (req.body.type === "unconfirm") {
            try {
                const result = await updateUserConfirmation(idd, 0);
                if (result.confirmed === 0) res.status(200).send("Success : set to rejected");
            } catch (err) {
                console.error(err);
                res.status(500).send("Internal Server Error-mongoose");
            }
        }
    };

    const handleWarnU = async () => {
        await removeFromList(AdminWarn, "warn_list", idd);

        if (req.body.type === "confirm") {
            let point = 0;
            const u = await User.findById(req.body.id);

            if (u.warned === 9) {
                await User.findByIdAndUpdate(req.body.id, { confirmed: 4 }, { new: true });
            } else {
                const handleDocument = async (docModel, docId, pointCalculation) => {
                    const boja = await docModel.findById(docId);
                    point = pointCalculation(boja);
                    u.POINT -= point;
                    u.warned += 1;
                    await u.save();
                };

                switch (req.body.filters) {
                    case "qna":
                        await handleDocument(QnaDocuments, req.body.docid, (boja) => (boja.likes / 10 + boja.scrap / 10) * 20);
                        break;
                    case "answer":
                        await handleDocument(QnaAnswers, req.body.docid, async(boja) => {
                            const pboja = await QnaDocuments.findById(boja.Rqna);
                            let addition = 0;
                            if (pboja.answer_list[pboja.picked_index] === req.body.docid) addition += pboja.point;
                            return (boja.likes / 10) * 20 + addition;
                        });
                        break;
                    case "pilgy":
                    case "honey":
                    case "test":
                        await handleDocument(PilgyDocuments, req.body.docid, async(boja) => {
                            const refundUsers = await AllFiles.findById(boja.Rfile, { Rpurchase_list: 1 }).lean();
                            return (boja.likes / 10 + boja.scrap / 10) * 20 + (boja.purchase_price * refundUsers.Rpurchase_list.length);
                        });
                        await User.updateMany({ _id: { $in: refundUsers.Rpurchase_list } }, { $inc: { POINT: boja.purchase_price } });
                        break;
                    default:
                        return res.status(400).json({ success: false, message: "Invalid filter" });
                }
            }
        } else if (req.body.type === "unconfirm") {
            const decrementWarn = async (docModel, docId) => {
                await docModel.findByIdAndUpdate(docId, { $inc: { warn: -10 } });
            };

            switch (req.body.filters) {
                case "qna":
                    await decrementWarn(QnaDocuments, req.body.docid);
                    break;
                case "answer":
                    await decrementWarn(QnaAnswers, req.body.docid);
                    break;
                case "pilgy":
                    await decrementWarn(PilgyDocuments, req.body.docid);
                    break;
                case "honey":
                    await decrementWarn(HoneyDocuments, req.body.docid);
                    break;
                case "test":
                    await decrementWarn(TestDocuments, req.body.docid);
                    break;
                default:
                    return res.status(400).json({ success: false, message: "Invalid filter" });
            }
        }
    };

    const handleScoreU = async () => {
        await removeFromList(AdminScore, "score_list", idd);

        if (req.body.type === "confirm") {
            const sc = await Score.findById(req.body.docid);
            sc.semester_list[req.body.type].confirmed = 2;
            const cred = sc.semester_list[req.body.type].credit_list.length;
            sc.semester_list[req.body.type].credit_list = Array(cred).fill(true);

            const scores = [];
            const indexes = sc.semester_list[req.body.type].grade_list.reduce((acc, a, index) => {
                if (a === 1 || a === 2 || a === 0) {
                    acc.push(index);
                    scores.push(a);
                }
                return acc;
            }, []);

            const subjects = indexes.map(index => sc.semester_list[req.body.type].subject_list[index]);
            subjects.forEach((a, i) => {
                if (!sc.overA_subject_list.includes(a)) {
                    sc.overA_subject_list.push(a);
                    sc.overA_type_list.push(scores[i]);
                }
            });

            await sc.save();
        }else{
            const sc = await Score.findById(req.body.docid);
            sc.semester_list[req.body.type].confirmed = 0;
            await sc.save();
        }
    };

    switch (req.body.where) {
        case "confirmU":
            await handleConfirmU();
            break;
        case "warnU":
            await handleWarnU();
            break;
        case "scoreU":
            await handleScoreU();
            break;
        default:
            res.status(400).json({ success: false, message: "Invalid request" });
    }
};


const handleAdminGetMongoose = async (req, res) => {
    User.findById(req.body.id, {name:1, hakbu:1, hakbun:1, _id:1})
    .then((result)=>{
        console.log(result);
        res.status(200).send(`<p>${result}</p>`);
    })
    .catch((err)=>{
        console.error(err);
        res.status(500).send('Internal Server Error-mongoose');
    });
}

//router.post('/admin/return')



export {handleAdminHome, handleAdminOnline, handleAdminRedis, handleAdminNewData, handleAdminMongoose, handleAdminGetMongoose}; 