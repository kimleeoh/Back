import rateLimit from "express-rate-limit";


// Create a rate limiter with a custom key generator
const limiter =(()=>{

    return{
        loginRate : ()=> rateLimit({
            windowMs: 1* 10 * 1000, // 10 seconds
            max: 50, // limit each IP to 5 requests per windowMs
            message: "Too many requests, please try again later."
        }),
        heavyRate : ()=> rateLimit({
            windowMs: 1* 60 * 1000, 
            max: 300, // limit each IP to 5 requests per windowMs
            message: "Too many requests, please try again later."
        }),
        lightRate : ()=> rateLimit({
            windowMs: 1* 60 * 1000, // 1 minute
            max: 200, // limit each IP to 5 requests per windowMs
            message: "Too many requests, please try again later."
        }),
        categoryRate:()=>rateLimit({
            windowMs: 1* 30 * 1000, // 30 seconds
            max: 1000, 
            message: "Too many requests, please try again later."
        }),
    }
})();

export default limiter;
