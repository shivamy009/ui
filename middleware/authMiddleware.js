
const jwt =require('jsonwebtoken')

require('dotenv').config()
exports.requireSignin=async(req,res,next)=>{
    try{
        const decode = await jwt.verify(req.headers.authorization,process.env.JWT_SECRET)
        req.user=decode;
        
        next();

    }
    catch(err){
        console.log(err)
        return res.status(400).json({
            success:false,
            message:"Failed in token verification"
        })
    }

}