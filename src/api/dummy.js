
import { QnaDocuments, HoneyDocuments,QnaAnswers,QnaAlready } from '../schemas/docs.js';
import { User } from '../schemas/user.js';
import { CommonCategory } from '../schemas/category.js';


// router.get('/dummy/testqna', async (req, res) => {
// });

const getQnaData = async (req, res) => {
    try{
        const result = await QnaAlready.findOne();
        console.log(result);    
        const answerData = await QnaAnswers.findById(result.answer_list[0].Ranswer,{_id:0,Rqna:0}).lean();
        const answerUserData = await User.findById(result.answer_list[0].Ruser, {level:1, hakbu:1, name:1,_id:0}).lean();
        
        const fin = {
            ...answerData, 
            ...answerUserData, 
            user_grade:result.answer_list[0].user_grade
        };

        result.answer_list = [fin];
        console.log(fin);
        res.status(200).json(result);
    }
    catch(e){
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
}

// router.get('/dummy/testtips', async (req, res) => {
// });

const getTipData = async (req, res) => {
    HoneyDocuments.findOne()
    .then((result)=>{
        res.status(200).json(result);
    })
    .catch((e)=>{
        console.error(e);
        res.status(500).send('Internal Server Error');
    });
}

// router.post('/dummy/category', async (req, res) => {
// });

const getCategory = async (req, res) => {
    //ex) {id:''}
    let tar=req.body.id;
    if(req.body.id==''){
        tar = '66f2bff07c788ef9a0347037';
    }
    CommonCategory.findById(tar).then(async(result)=>{
        if(result.timeIcredit==undefined){
            let subCategoryIds;
            if(result.type==2){
                subCategoryIds = result.sub_category_list.map(sem => sem.map(id => String(id)));
                subCategoryIds = subCategoryIds.flat();
            }else{
                subCategoryIds = result.sub_category_list.map(id => String(id));
        }
            const ss = await CommonCategory.find({_id:{$in:subCategoryIds}});
                const ress = {
                    name:result.category_name,
                    sub_category_list_name:ss.map((a)=>a.category_name),
                    sub_category_list_id:subCategoryIds,
                    type:result.type
                    
                }
                res.status(200).json(ress);
        }else{
                res.status(200).json(result);
        }
        })
        .catch((e)=>{
            console.error(e);
            res.status(500).send('Internal Server Error');
        });
    }

export { getQnaData, getTipData, getCategory };