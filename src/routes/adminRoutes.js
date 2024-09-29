import express from 'express';
import { 
    handleAdminLogin, 
    handleAdminLogout, 
    handleAdminSessionTimeLeft
} from '../admin/adminLogin.js';
import { 
    handleAdminHome, 
    handleAdminOnline, 
    handleAdminRedis, 
    handleAdminNewData, 
    handleAdminMongoose 
} from '../admin/adminRoutes.js';


const router = express.Router();

router.get('/', handleAdminHome);
router.get('/admin/online', handleAdminOnline);
router.post('/admin/redis', handleAdminRedis);
router.get('/admin/online/newData', handleAdminNewData);
router.post('/admin/mongoose', handleAdminMongoose);

router.post('/admin/login', handleAdminLogin);
router.post('/admin/logout', handleAdminLogout);
router.get('/admin/session-time-left', handleAdminSessionTimeLeft);


export default router;