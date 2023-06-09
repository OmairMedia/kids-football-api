// *******  LIBRARIES
const express = require("express");
const admin = require('firebase-admin');
const { body, validationResult } = require("express-validator");
const moment = require("moment");
const {
  usersRef,
  adminRef
} = require("../../db/ref");


const saltRounds = 10;
const bcrypt = require("bcrypt");








// Helper Functions
// const {
//   checkUserExistsUserApp,
//   getCurrentDate,
//   getCurrentTimestamp,
// } = require("../../functions/slash");


const router = express.Router();


router.get('/test', (req,res) => {
  const snapshot = usersRef.once('value')
})

// *********** USER AUTHENTICATION POST REQUESTS ***********

// Sending OTP Code / User Data Stored In  -> sms/register

//   {
//     "fullname":"fahad",
//     "email": "fahad@4slash.com",
//     "phone": "+923243288887",
//     "password": "fahad123",
// }
router.post(
  "/register",
  body("fullname")
    .isLength({ max: 20 })
    .withMessage("Fullname must be less than 20 characters"),
  body("email").isEmail().withMessage("Invalid Email !"),
  body("phone").custom((value) => {
    function isValidPhonenumber(value) {
      return /^\d{7,}$/.test(value.replace(/[\s()+\-\.]|ext/gi, ""));
    }
    if (isValidPhonenumber(value)) {
      return Promise.resolve();
    } else {
      return Promise.reject("Phone Number is not international");
    }
  }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password Must Be 6 Characters at least!"),
  // Validator
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      next();
    }
  },
  // Check User
  (req, res, next) => {
    const body = req.body;
    
    try {
      usersRef.orderByChild('email').equalTo(body.email).once('value', (snapshot) => {
        if(snapshot.val()) {
           const users = [];
           snapshot.forEach((x)=>{
            users.push({
              ...x.val(),
              id: x.key
            })
           });
           
           if(users.length > 0) {
            res.json({
              status:false,
              error: 'Account already exists on this email!'
            }) 
           } else {
            next();
           }
        } else {
          next()
        }
      })
    } catch (err) {
      res.json({
        status:false,
        error: err
      }) 
    }
  },
  // Save User
  (req,res,next) => {
    const body = req.body;

    const newUser = usersRef.push();

    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(body.password, salt);

    let data = {
      id: newUser.key,
      fullname: body.fullname,
      email: body.email,
      phone: body.phone,
      photoURL: "",
      password: hash,
      createdAt: moment().valueOf(),
      updatedAt: moment().valueOf()
    }

    newUser.set(data).then(()=>{
      res.json({
        status:true,
        message: 'Account created successfully!',
        user: data
      })
    }).catch((err)=>{
      res.json({
        status:false,
        error:err
      })
    })
  }
);


// Login
router.post(
  "/login",
  body("email").isEmail().withMessage("Invalid Email!"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password Must Be 6 Characters at least!"),
  // Validator
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      next();
    }
  },
  // Check User
  (req, res, next) => {
    const body = req.body;
    
    try {
      usersRef.orderByChild('email').equalTo(body.email).once('value', (snapshot) => {
        if(snapshot.val()) {
           const users = [];
           snapshot.forEach((x)=>{
            users.push({
              ...x.val(),
              id: x.key
            })
           });
           
           if(users.length > 0) {
            req.body.user = users[0];
            next()
           } else {
            res.json({
              status:false,
              error: 'Invalid Email!'
            })
           }
        } else {
          res.json({
            status:false,
            error: 'Invalid Email!'
          })
        }
      })
    } catch (err) {
      res.json({
        status:false,
        error: err
      }) 
    }
  },
  // Check Password
  (req,res,next) => {
    const body = req.body;
   
    const compare = bcrypt.compareSync(body.password, body.user.password);
    
    // console.log('body.user.password -> ',body.user.password);
    // console.log('body.password -> ',body.password);
    // console.log('compare -> ',compare)
    
    if(compare) {
      //  Password Match Success
      const additionalClaims = {
        fullname:body.user.fullname,
        email: body.user.email,
        photoURL: body.user.photoURL,
        phone: body.user.phone,
        user_type: "user"
      };

      admin
        .auth()
        .createCustomToken(body.user.id, additionalClaims)
        .then((customToken) => {
          res.json({
            status: true,
            token: customToken,
            user: body.user,
          });
        });
    } else {
      res.json({
        status:false,
        error: 'Incorrect Password!'
      })
    }
  }
);

// OTP Verification / OTP Record Remove / User Creation
router.post(
  "/register_after_otp",
  body("otp").isNumeric().withMessage("Please enter a valid otp"),
  // Validator
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      next();
    }
  },
  (req, res, next) => {
    //  @Data in Request Body
    //   {
    //     "otp":"77754",
    //   }

    const { otp } = req.body;

    registrationOTPRef
      .orderByChild("code")
      .equalTo(parseInt(otp))
      .once("value")
      .then(async (userSnap) => {
        const data = userSnap.val();
        if (data == null) {
          res.json({
            status: false,
            message: "Verification Failed !",
          });
        } else {
          // console.log("User Is -> ", data);
          const userData = data[otp].user;
          // console.log("This is user data -> ", userData);

          // See the UserRecord reference doc for the contents of userRecord.

          let uid = 1;

          const salt = bcrypt.genSaltSync(saltRounds);
          const hash = bcrypt.hashSync(userData.password, salt);

          if (userData.form === "user") {
            await usersRef
              .child("users")
              .limitToLast(1)
              .once("value", (snapshot) => {
                if (snapshot.val()) {
                  uid = parseInt(Object.entries(snapshot.val())[0][1].id) + 1;
                }
              });

            userRef
              .child("users")
              .child(userData.phone)
              .set({
                ...userData,
                password: hash,
                id: uid,
                created: getCurrentDate(),
                created_timestamp: getCurrentTimestamp(),
                verified: true,
                blocked: false,
              })
              .then(() => {
                walletRef
                  .child("users")
                  .child(userData.phone)
                  .set({
                    amount: "0",
                    type: "cash",
                    transactions: [],
                  })
                  .then(() => {
                    const additionalClaims = {
                      user_type: "user",
                    };

                    admin
                      .auth()
                      .createCustomToken(userData.phone, additionalClaims)
                      .then((customToken) => {
                        sessionsRef
                          .child("users")
                          .child(userData.phone)
                          .set({
                            phone: userData.phone,
                            type: "user",
                            lastLogin: getCurrentDate(),
                            active: true,
                          })
                          .then(() => {
                            registrationOTPRef
                              .child(parseInt(otp))
                              .remove()
                              .then(() => {
                                res.json({
                                  status: true,
                                  message: "User Created Successfully ! ",
                                  active: true,
                                  application: false,
                                  token: customToken,
                                });
                              });
                          })
                          .catch((err) => {
                            res.json({
                              status: false,
                              error: err.message,
                            });
                          });
                      });
                  })
                  .catch((error) => {
                    res.json({
                      status: false,
                      error: error.message,
                    });
                  });
              })
              .catch((err) => {
                res.json({
                  status: false,
                  message: "Data could not be saved. ",
                  error: err.message,
                });
              });
          } else if (userData.form === "pro") {
            await proRef.limitToLast(1).once("value", (snapshot) => {
              if (snapshot.val()) {
                uid = parseInt(Object.entries(snapshot.val())[0][1].id) + 1;
              }
            });

            userRef
              .child("pro")
              .child(userData.phone)
              .set({
                ...userData,
                id: uid,
                created: getCurrentDate(),
                created_timestamp: getCurrentTimestamp(),
                verified: true,
                application_status: false,
                blocked: false,
              })
              .then(() => {
                walletRef
                  .child("users")
                  .child(userData.phone)
                  .set({
                    amount: "0",
                    type: "cash",
                    transactions: [],
                  })
                  .then(() => {
                    // const token = jwt.sign(
                    //   {
                    //     phone: userData.phone,
                    //     type: "pro",
                    //   },
                    //   JWT_SECRET
                    // );
                    const additionalClaims = {
                      user_type: "user",
                    };

                    admin
                      .auth()
                      .createCustomToken(userData.phone, additionalClaims)
                      .then((customToken) => {
                        sessionsRef
                          .child("pro")
                          .child(userData.phone)
                          .set({
                            phone: userData.phone,
                            type: "pro",
                            lastLogin: getCurrentDate(),
                            active: true,
                          })
                          .then(() => {
                            registrationOTPRef
                              .child(parseInt(otp))
                              .remove()
                              .then(() => {
                                res.json({
                                  status: true,
                                  message: "Pro User Created Successfully ! ",
                                  application: userData.application_status,
                                  active: userData.password ? true : false,
                                  token: customToken,
                                });
                              });
                          })
                          .catch((err) => {
                            res.json({
                              status: false,
                              error: err.message,
                            });
                          });
                      });
                  })
                  .catch((error) => {
                    res.json({
                      status: false,
                      error: error.message,
                    });
                  });
              })
              .catch((err) => {
                res.json({
                  status: false,
                  message: "Error creating user ",
                  error: err.message,
                });
              });
          }
        }
      })
      .catch((err) => {
        res.json({
          status: false,
          message: err.message,
        });
      });
  }
);


// Create Admin
router.post('/create-admin', 
(req,res) => {
   try {
    const body = req.body;

   const newAdmin = adminRef.push();

   const salt = bcrypt.genSaltSync(saltRounds);
   const hash = bcrypt.hashSync(body.password, salt);

   newAdmin.set({
     fullname: body.fullname,
     email: body.email,
     password: hash,
     createdAt: moment().valueOf(),
     updatedAt: moment().valueOf(),
     photoURL: "",
   }).then(()=>{
      res.json({
        status:true,
        message: 'Admin created!'
      })
   }).catch((err)=>{
    res.json({
      status:false,
      error: err
    })
   })
   } catch (err) {
    res.json({
      status:false,
      error: err
    })
   }
}
)


// Admin Login
router.post('/authenticate-admin',
//  Get Data
(req,res,next) => {
  try {
    const body = req.body;

    adminRef.once('value', (snapshot) => {
      let users = [];
      snapshot.forEach((x)=>{
        users.push({
          ...x.val(),
          id: x.key
        });
      });
      req.body.users = users;
      next()
    })
  } catch (err) {
    res.json({
      status:false,
      error:err
    })
  }
},
// Match User
(req,res,next)=>{
  const body = req.body;

  let users = body.users;
  
  // Match Email
  const checkemail = users.filter(x => x.email === body.email);

  if(checkemail && checkemail.length > 0) {
    let givenPassword = body.password;
    let hash = checkemail[0].password;
    const salt = bcrypt.genSaltSync(saltRounds);
    const compare = bcrypt.compareSync(givenPassword,hash);

    if(compare) {
      //  Password Match Success
      const additionalClaims = {
        fullname: checkemail[0].fullname,
        email: checkemail[0].email,
        photoURL: checkemail[0].photoURL,
        user_type: "admin",
      };

      admin
        .auth()
        .createCustomToken(checkemail[0].id, additionalClaims)
        .then((customToken) => {
          res.json({
            status: true,
            token: customToken,
            user: checkemail[0],
          });
        });
    } else {
      // Password Match Failed
      res.json({
        status:false,
        error: "Invalid Password!"
      })
    }
  } else {
    // Email Dont Match
    res.json({
      status:false,
      error: "Invalid Email!"
    })
  }
}
)

module.exports = router;
