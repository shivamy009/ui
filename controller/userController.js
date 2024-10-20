const User = require('../model/userModel')
const bcrypt = require('bcrypt')
// import { nanoid } from 'nanoid'

const jwt = require('jsonwebtoken')
// const { use } = require('../router/userRoute')
// const nanoid  = require('nanoid')

// const generateUsername =async(email)=>{
//     let username=email.split('@')[0];

//     let isusernameNotunique=await User.exists({"personal_info.username":username}).then((result)=>result)

//     isusernameNotunique ?username+=nanoid().substring(0,5):"";

//     return username

// }

const formateData=(user)=>{
       const access_token=jwt.sign({id:user._id},process.env.JWT_SECRET)
       return {
        access_token,
        profile_img:user.personal_info.profile_img,
        username:user.personal_info.username,
        fullname:user.personal_info.fullname
       }
}


exports.Signup= async(req,res)=>{
    try{
        let {fullname,email,password}=req.body
    
        if(!email || !password || !fullname){
            return res.status(400).json({
                success:false,
                message:"Please Enter All field"
            })
    
        }
        if(fullname.lenght<3){
            return res.status(401).json({
                success:false,
                message:"Full name must be greater than 3 letter"
            })
    
        }
        let existinguser= await User.findOne({"personal_info.email":email})
        // const existinguser = await User.findOne({email})

        if(existinguser){
            return res.status(400).json({
                success:false,
                message:"This email is already resistured with us please login or use another email"
            })
     
        }

        let hashpassword = await bcrypt.hash(password,10)
        let username=email.split('@')[0]+"123";

        const user = await new User ({
            personal_info:{
                fullname,email,password:hashpassword,username
            }

        }).save()

        let sendData=formateData(user)

        return res.status(200).json({
            success:true,
            message:"User signup success",
            sendData

        })

    }
    catch(e){
        console.log(e)
        return res.status(400).json({
            success:false,
            message:"Something went wrong while creating registration",

        })
    }
 
}

exports.signIn=async(req,res)=>{
    try{
        const{email,password}= req.body;
    
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        let user= await User.findOne({"personal_info.email":email})

        if(!user){
            return res.status(400).json({
                success:false,
                message:"This user is not registered"
            })

        }

        const match = await bcrypt.compare(password,user.personal_info.password);
        if(!match){
            return res.status(400).json({
                success:false,
                message:"Password Incorrect"
            })

        }

        //// const token = await jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        // const token = await jwt.sign({_id:user.id},process.env.JWT_SECRET,{expiresIn:'7d'})

        // console.log(user)
        
        // user = user.toObject();
        
        // user.password=undefined;
        // console.log(user)

        let sendData=formateData(user)

        return res.status(200).json({
            success:true,
            message:"User login success",
           sendData
        })
 
    }
    catch(err){
        console.log(err)
        return res.status(400).json({
            success:false,
            message:"Error while login"
        })
    }
}
exports.changePassword=async(req,res)=>{
      let {currentPassword,newPassword}=req.body;
    //   console.log(currentPassword,newPassword)
      let userId=req.user.id;
      if(!currentPassword || !newPassword){
        return res.status(403).json({error:"Please fill all field"})
    }

    User.findOne({_id:userId})
    .then((user)=>{
        if(user.google_auth){
            return res.status(403).json({error:"You can't change account password"})
        }

         bcrypt.compare(currentPassword,user.personal_info.password,(err,result)=>{
            if(err){
                return res.status(500).json({error:"Something went wromg while change password"})
            }
            if(!result){
                return res.status(403).json({error:"Incorrect current password"})
            }
            bcrypt.hash(newPassword,10,(err,hashed_password)=>{
              User.findOneAndUpdate({_id:userId},{"personal_info.password":hashed_password})
              .then((u)=>{
                return res.status(200).json({status:"password changed"})
              })
              .catch(err=>{
                return res.status(500).json({error:"Some error occured while saving new password"})
              })
            })
         })

    })
    .catch(err=>{
        console.log(err)
        return res.status(500).json({error:"User not found"})
    })
}

// exports.uploadData=async(req,res)=>{
//     console.log(req.user)
//        res.send(req.body)
// }