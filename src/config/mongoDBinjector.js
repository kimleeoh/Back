//추후 이거 통해서 몽고디비에 과목 관련 데이터 넣을 예정

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category, LowestCategory } from "../schemas/category";
import fs from "fs";

dotenv.config();

const { MONGO_URI } = process.env;

mongoose
    .connect(MONGO_URI, {dbName: "root"})
    .then(()=>console.log('Successfully connected to mongodb'))
    .catch(e=>console.error(e));



