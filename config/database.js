const mongoose = require('mongoose')

const databaseconn = ()=>{
    mongoose.connect(process.env.MONGO_URL,{
        autoIndex:true
    })
    .then(()=>console.log("Db connection success"))
    .catch((e)=>{
        console.log("Error in connection with database",e)
    })
}

module.exports=databaseconn