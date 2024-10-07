import { ADMIN_AUTH_CODE } from './adminAuthcodeSafer.js';
import { AdminConfirm, AdminWarn, AdminUsers } from './adminSchemas.js';
import redisHandler from '../config/redisHandler.js';
import {User} from '../schemas/user.js';
import mongoose, {SchemaTypes} from 'mongoose';
import s3Handler from '../config/s3Handler.js';
import {CustomBoardView, UserDocs, Score} from '../schemas/userRelated.js';

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
    if(req.session.user!=undefined&&req.session.user.authCode!=undefined && req.session.user.authCode === ADMIN_AUTH_CODE.get()){
        console.log("yup");
        const redisClient = redisHandler.getRedisClient();
        AdminConfirm.findOne({_id:0})
        .then((result)=>{
            console.log(result);
            AdminWarn.findOne({_id:1})
            .then((warn)=>{
                AdminUsers.findOne({_id:2})
                .then((users)=>{
                    redisClient.sMembers('logged_in_admins')
                    .then((members) => {
                        redisClient.sMembers('selected')
                        .then((selecte) => {
                            console.log("inits:",selecte);
                            res.render('admin.ejs', {presentAdmin: members, waitingUser:result.unconfirmed_list, selected:selecte, warned:warn.warn_list, quitUser:users.out_user_list, allUser:users.all_user_sum});
                        });
                    })
                    .catch((err) => {
                          console.error('Redis error:', err);
                          res.status(500).send('Internal Server Error-Redis');
    
                  });
                })
            })
            .catch((err) => {
                  console.error('Redis error:', err);
                  res.status(500).send('Internal Server Error-Redis');

          });
        })
        .catch(()=>{res.status(500).send('Internal Server Error-Mongo');}); 
    }else{
        res.status(401).send("Unauthorized");
    }
}

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
    if (req.body.where == "confirmU") {
        AdminConfirm.updateOne(
            {
                _id: "0",
            },
            {
                $pull: {
                    unconfirmed_list: {
                        Ruser: idd,
                    },
                },
            }
        ).then(() => {
            console.log("Deleted the complete request from MongoDB");
        });

        if (req.body.type == "confirm") {
            User.findOneAndUpdate({ _id: idd }, { confirmed: 2 }, { new: true })
                .then(async (result) => {
                    const myCustom = new CustomBoardView({
                        _id: result.Rcustom_brd,
                        Renrolled_list: [],
                        Rbookmark_list: [],
                        Rlistened_list: [],
                    });

                    const myDoc = new UserDocs({
                        _id: result.Rdoc,
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

                    // 여기에서 final 변수를 result로 수정
                    const myScore = new Score({
                        _id: result.Rscore,
                        Ruser: result._id, // final._id 대신 result._id 사용
                        overA_subject_list: [],
                        overA_type_list: [],
                        semester_list: {
                            Rcategory_list: [],
                            subject_list: [],
                            credit_list: [],
                            grade_list: [],
                            ismajor_list: [],
                            is_show_list: [],
                        },
                    });

                    await myCustom.save();
                    await myDoc.save();
                    await myScore.save();

                    if (result.confirmed == 2)
                        res.status(200).send("Success : set to confirmed");
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send("Internal Server Error-mongoose");
                });
        } else if (req.body.type == "unconfirm") {
            User.findOneAndUpdate({ _id: idd }, { confirmed: 0 }, { new: true })
                .then((result) => {
                    if (result.confirmed == 0)
                        res.status(200).send("Success : set to rejected");
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send("Internal Server Error-mongoose");
                });
        }
    } else if (req.body.where == "warnU") {
        console.log("not developed yet since lack of data.");
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