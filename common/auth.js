const bcrypt =require('bcryptjs')
const jwt=require('jsonwebtoken')
const saltRound =10;



const hashPassword = async(password)=>{
    let salt =await bcrypt.genSalt(saltRound)

    let hashedPassword = await bcrypt.hash(password,salt)
    return hashedPassword

}

const hashCompare = async(password,hashedPassword)=>{
    return await bcrypt.compare(password,hashedPassword)
}

const createToken = async(payload)=>{
    let token= await jwt.sign(payload,process.env.secretkey,{expiresIn:'2m'})
    return token
}

const validate= async(req,res,next)=>{
    console.log(req.headers.authorization)
    if(req.headers.authorization){
        let token= req.headers.authorization.split(" ")[1]
        // console.log(token)
        let data=  await jwt.decode(token)
        console.log(data)
        if(Math.floor((+new Date())/1000)< data.exp){
           return next()
        }else{
            res.status(402).send({
                message:"Token Expired"
            })
        }

        return next()
    }
    else{
       return res.status(400).send({
            message:'Token not found' 
        })
    }
}



// const authenticate = (req, res, next) => {
//   console.log(req.body.token)
//     if (req.body.token) {
//       try {
   
//         // let decode = jwt.verify(req.body.token, process.env.secretkey)
//         // if (decode) {
//         //   next();
//         // }
  
//       } catch (error) {
//         res.status(401).send({
//           message: "Your Token is Expired",
//           error,
//         })
//       }
  
//     } else {
//       res.status(401).send({
//         message: "Unauthorized",
//       })
//     }
  
//   }
  


// const roleAdminGuard = async(req,res,next)=>{
//     if(req.headers.authorization){
//         let token= req.headers.authorization.split(" ")[1]
//         // console.log(token)
//         let data=  await jwt.decode(token)
//         console.log(data)
//         if(data.role==='admin'){
//             next()
//         }else{
//             res.status(402).send({
//                 message:"Only Admins are Allowed"
//             })
//         }

//         next()
//     }
//     else{
//         res.status(400).send({
//             message:'Token not found' 
//         })
//     }

// }



module.exports={hashPassword,hashCompare,createToken,validate}