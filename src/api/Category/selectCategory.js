import { CommonCategory } from "../../schemas/category.js";

const getCategory = async (req, res) => {
    //ex) {id:''}
    let tar = req.body.id;
    if (req.body.id == "") {
        tar = "66f2bff07c788ef9a0347037";
    }
    CommonCategory.findById(tar).then(async(result)=>{
                
        if(result.timeIcredit==undefined){
            let subCategoryIds;
            if(Array.isArray(result.sub_category_list[0])){
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
                // const ss = await CommonCategory.find({
                //     _id: { $in: subCategoryIds },
                // });
                // const ress = {
                //     name: result.category_name,
                //     sub_category_list_name: ss.map((a) => a.category_name),
                //     sub_category_list_id: subCategoryIds,
                // };
                res.status(200).json(ress);
            } else {
                res.status(200).json(result);
            }
        })
        .catch((e) => {
            console.error(e);
            res.status(500).send("Internal Server Error");
        });
};

export { getCategory };