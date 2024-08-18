import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import redisHandler from './config/redisHandler.js';
import s3Handler from './config/s3Handler.js';

import adminLoginRoute from './admin/adminLogin.js';
import adminHomeRoute from './admin/adminRoutes.js';

import loginRoute from './api/login.js';
import apiRoute from './api/dummy.js';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { setupSocketIO } from './io.js';
import session from 'express-session';
//import cors from 'cors';


dotenv.config();
const adminApp = express();
const clientApp = express();


const {
    MONGO_URI,
    ADMIN_PORT, 
    CLIENT_PORT,
    REDIS_URL,
    SESSION_SECRET,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_REGION,
    AWS_S3_BUCKET,
} = process.env;

const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000 // 2 시간
    }
  });

redisHandler.create(REDIS_URL);
s3Handler.create([AWS_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET]);

//adminApp.set('views', 'src/admin/views');
adminApp.set('view engine', 'ejs');
adminApp.use('/admin', express.static('src/admin/'));
adminApp.use(sessionMiddleware);
adminApp.use(express.urlencoded({extended: true}));
adminApp.use(express.json());
//app.use(cors());

//clientApp.use('/api', express.static('src/api'));
//clientApp.use('/schemas', express.static('src/schemas'));
clientApp.use(express.urlencoded({extended: true}));
clientApp.use(express.json());

s3Handler.connect();

redisHandler.connect();

mongoose
    .connect(MONGO_URI, {dbName: "root"})
    .then(()=>console.log('Successfully connected to mongodb'))
    .catch(e=>console.error(e));

adminApp.use('/admin', adminLoginRoute);
adminApp.use('/', adminHomeRoute);

clientApp.use('/', loginRoute);
clientApp.use('/api', apiRoute);


clientApp.listen(CLIENT_PORT, ()=> {
    console.log(`Client server listening on port ${CLIENT_PORT}`);
});

const adminServer = adminApp.listen(ADMIN_PORT, ()=>{
    console.log(`Admin server listening on port ${ADMIN_PORT}`);
});
const io = new Server(adminServer, {path: '/admin/online'});
setupSocketIO(io);





