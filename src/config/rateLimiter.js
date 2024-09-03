import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 5 requests per windowMs
    message: "Too many requests, please try again later."
});

export default limiter;