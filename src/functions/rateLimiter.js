import rateLimit from "express-rate-limit";

const limiter = rateLimit({
<<<<<<< Updated upstream
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 5 requests per windowMs
    message: "Too many requests, please try again later."
=======
    windowMs: 10 * 1000, // 1 minute
    max: 60, // limit each IP to 5 requests per windowMs
    message: "Too many requests, please try again later.",
>>>>>>> Stashed changes
});

export default limiter;
