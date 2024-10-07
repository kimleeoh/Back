import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 10 * 1000, // 1 minute
    max: 120, // limit each IP to 5 requests per windowMs
    message: "Too many requests, please try again later."
});

export default limiter;
