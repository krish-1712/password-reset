var express = require('express');
var router = express.Router();
const { userModel } = require('../schemas/userSchema')
const mongoose = require('mongoose')
const { dbUrl } = require('../common/dbConfig')
const { hashPassword, hashCompare, createToken, validate,forgot,authenticate} = require('../common/auth')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser')
const cors = require("cors");

router.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
router.use(bodyParser.json())


router.use(cors({
    origin:process.env.BASE_URL
  }))



mongoose.connect(dbUrl)

/* GET users listing. */
router.get('/dummy', validate, async function (req, res) {
  try {
    let users = await userModel.find();
    console.log(users);
    return res.status(200).send({
      users,
      message: 'Users Data Fetch Successfully!'
    })

  } catch (error) {
    res.status(500).send({
      message: 'Internal Server Error',
      error
    })
    console.log(error);
  }

});

router.get('/:id', async (req, res) => {
  try {
    let user = await userModel.findOne({ _id: req.params.id });
    res.status(200).send({
      user,
      message: 'Users Data Fetch Successfully!'
    })

  } catch (error) {
    res.status(500).send({
      message: 'Internal Server Error',
      error
    })
  }

});

router.post('/signup', async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.body.email })
    if (!user) {

      let hashedPassword = await hashPassword(req.body.password)
      req.body.password = hashedPassword
      let user = await userModel.create(req.body)
      res.status(200).send({
        message: "User Signup Successfully!",
      })
    }
    else {
      res.status(400).send({
        message: 'Users Already Exists!'
      })
    }

  } catch (error) {
    res.status(500).send({
      message: 'Internal Server Error',
      error
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.body.email })
    if (user) {

      // verify the password
      if (await hashCompare(req.body.password, user.password)) {
        // create the Token
        let token = await createToken({
          name: user.name,
          email: user.email,
          id: user._id,
          role: user.role
        })
        res.status(200).send({
          message: "User Login Successfully!",
          token
        })
      }
      else {
        res.status(402).send({
          message: "Invalid Credentials"
        })
      }

    }
    else {
      res.status(400).send({
        message: 'Users Does Not Exists!'
      })
    }

  } catch (error) {
    res.status(500).send({
      message: 'Internal Server Error',
      error
    })
  }
})


router.put('/:id', async (req, res) => {
  try {
    let user = await userModel.findOne({ _id: req.params.id })
    if (user) {
      user.name = req.body.name
      user.email = req.body.email
      user.password = req.body.password

      await user.save()

      res.status(200).send({
        message: "User Updated Successfully!"
      })
    }
    else {
      res.status(400).send({
        message: 'Users Does Not Exists!'
      })
    }

  } catch (error) {
    res.status(500).send({
      message: 'Internal Server Error',
      error
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    let user = await userModel.findOne({ _id: req.params.id })
    if (user) {
      let user = await userModel.deleteOne({ _id: req.params.id })
      res.status(200).send({
        message: "User Deleted Successfull!"
      })
    }
    else {
      res.status(400).send({
        message: 'Users Does Not Exists!'
      })
    }

  } catch (error) {
    res.status(500).send({
      message: 'Internal Server Error',
      error
    })
  }
})




router.post("/reset-sendmail",forgot, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.body.email })
    if (user) {
  
      let url = `${process.env.BASE_URL}/password/${user._id}/${token}`;

      let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 993,
        secure: false,
        auth: {
          user: process.env.EMAILUSE, 
          pass: process.env.EMAILPASS, 
        },
      });
      let details = {
        from: "foo@gmail.com", 
        to: user.email, 
        subject: "Hello ✔", 
        text: `Reset link`, 
        html: `<div><span>Password Reset Link : - </span> <a href=${url}> Click
        here !!!</a>

    <div>
        <h4>
            Note :-
            <ul>
                <li>This link only valid in 10 minitues</li>
            </ul>
        </h4>
    </div>
</div>`,
      };

      await transporter.sendMail(details, (err) => {
        if (err) {
          res.status(200).send({
            message: "It has Some Error for Send a Mail",
          });
        } else {
          res.status(200).send({
            message: "Password Reset Link Send in your Mail",
          });
        }
      });
    } else {
      res.status(401).send({
        message: "Please Enter vaild Email Address",
      });
    }

  
    await mongoose.close(dbUrl);
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error,
    });
  }
});

 
router.post('/password-reset',authenticate,async(req,res)=>{
  try{
    let users =await userModel.find();
    req.body.password = hashPassword
    users.updateOne({_id:(req.body.id)},{$set:{ password: req.body.password }})

    res.status(200).send({
      message:"Password Reset successfully",
    })

  }catch(error){
    res.status(400).send({
      message:"Some Error Occured",
    })

  }
})

module.exports = router;
