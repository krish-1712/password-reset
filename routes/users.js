var express = require('express');
var router = express.Router();
const { userModel } = require('../schemas/userSchema')
const mongoose = require('mongoose')
const { dbUrl } = require('../common/dbConfig')
const { hashPassword, hashCompare, createToken, validate } = require('../common/auth')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');


mongoose.connect(dbUrl)

/* GET users listing. */
router.get('/dummy', validate, async function (req, res) {
  if (req.user.isAdmin) {
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
 } else {
    res.status(403).json("You are not allowed!");
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
    console.log(user)

    if (!user) {
      let hashedPassword = await hashPassword(req.body.password)
      req.body.password = hashedPassword
      let user = await userModel.create({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password,

      })
      console.log(user)
      res.status(200).send({
        message: "Users Created Successfully!",
        user,
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
        message: "User Deleted Successfull!",
        user
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




router.post("/reset", async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.body.values.email })  
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const token = jwt.sign({ userId: user.email }, process.env.secretkey, { expiresIn: '1h' });

    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD

      },
    });
    const queryParams = new URLSearchParams();
    queryParams.set('token', token);
    const queryString = queryParams.toString();
    let details = {
      from: "greenpalace1712@gmail.com",
      to: user.email,
      subject: "Hello ✔",
      html: `
        <p>Hello,</p>
        <p>Please click on the following link to reset your password:</p>
        <a href="${process.env.CLIENT_URL}/password?${queryString}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    await transporter.sendMail(details)
    res.status(200).send({ message: 'Password reset email sent' })
    console.log(details)


  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
      error,
    });
  }
});


router.post('/password-reset', async (req, res,next) => {


  try {
    const users = await userModel.findOne({ email: req.body.email });
 
    const token = req.body.token; 

    let hashedPassword = await hashPassword(req.body.password)

    
    let decodedToken = jwt.verify(token, process.env.secretkey)

    console.log("decoded : "+decodedToken)
    const userId = decodedToken.userId;
  
    const filter = { email: userId };
    const update = { password: hashedPassword };

    const doc = await userModel.findOneAndUpdate(filter, update);
  


    res.status(200).send({
      message: "Password Reset successfully",
    })

  } catch (error) {
    res.status(400).send({
      message: "Some Error Occured",
    })
  }
})


module.exports = router;
