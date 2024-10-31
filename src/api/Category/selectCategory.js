import { CommonCategory } from "../../schemas/category.js";

const getCategory = async (req, res) => {
    let tar = req.body.id;
    if (req.body.id === "") {
        tar = "66f2bff07c788ef9a0347037";
    }

    CommonCategory.findById(tar)
        .then(async (result) => {
            if (result.timeIcredit === undefined) {
                let subCategoryIds;
                if (Array.isArray(result.sub_category_list[0])) {
                    subCategoryIds = result.sub_category_list
                        .map((sem) => sem.map((id) => String(id)))
                        .flat();
                } else {
                    subCategoryIds = result.sub_category_list.map((id) =>
                        String(id)
                    );
                }

                // 중복 제거
                subCategoryIds = [...new Set(subCategoryIds)];

                const ss = await CommonCategory.find({
                    _id: { $in: subCategoryIds },
                });
                const ress = {
                    name: result.category_name,
                    sub_category_list_name: ss.map((a) => a.category_name),
                    sub_category_list_id: subCategoryIds,
                    type: result.type,
                };
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
