import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import loginRoute from './auth/login.js';
import adminRoute from './admin/adminLogin.js';
import homeRoute from './route/home.js';
import apiRoute from './api/totalApis.js';
import jwt from 'jsonwebtoken';
import session from 'express-session';
//import cors from 'cors';
import redis from 'redis';
//const client = redis.createClient({ url: 'redis://<your_redis_url>' });


dotenv.config();
const app = express();


const {PORT, MONGO_URI} = process.env;

const sessionMiddleware = session({
    secret: 'ceoIr93@a0fj329Sd',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000 // 8 시간
    }
  });

app.set('views', 'src/views');
app.set('view engine', 'ejs');
app.use(express.static('src'));
app.use(sessionMiddleware);
app.use('/node_modules',express.static('node_modules'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
//app.use(cors());

app.use('/', homeRoute);
app.use('/', loginRoute);
app.use('/admin', adminRoute);
app.use('/api', apiRoute);

mongoose
    .connect(MONGO_URI, {dbName: "root"})
    .then(()=>console.log('Successfully connected to mongodb'))
    .catch(e=>console.error(e));

/*client.connect()
      .then(()=>console.log('Successfully connected to redis'))
      .catch(e=>console.error(e));*/

app.listen(PORT, ()=>{
    console.log(`Server listening on port ${PORT}`);
});
