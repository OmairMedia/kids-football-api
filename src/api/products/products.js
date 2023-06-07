const express = require("express");
const { body, validationResult } = require("express-validator");
const moment = require("moment");
const {
  usersRef,
  productRef
} = require("../../db/ref");

const saltRounds = 10;
const bcrypt = require("bcrypt");

const router = express.Router();

router.post(
    '/create-product',
    // body("name").isEmpty().withMessage("Product Name Is Required!"),
    // body("description").isEmpty().withMessage("Product Description Is Required!"),
    // body("category").isEmpty().withMessage("Product Category Is Required!"),
    // body("thumbnail").isEmpty().withMessage("Product Image Is Required!"),
    // body("price").isEmpty().withMessage("Product Price Is Required!"),
    // body("stock").isEmpty().withMessage("Product Stock Status Is Required!"),
      // Validator
    // (req, res, next) => {
    //     const errors = validationResult(req);
    //     if (!errors.isEmpty()) {
    //        res.status(400).json({ errors: errors.array() });
    //     } else {
    //         next();
    //     }
    // },
    (req,res) => {
       try {
        const body = req.body;
        
        const { name , description , thumbnail , price , category , stock } = body
        const createdAt = moment();
        const updatedAt = moment();
        const newProduct = productRef.push();

        newProduct.set({
           id: newProduct.key,
           name: name,
           description: description,
           thumbnail: thumbnail,
           price: price,
           category: category,
           stock: stock
        }).then(()=>{
           res.json({
              status:true,
              message: "Order created successfully!"
           })
        }).catch((err)=>{
            res.json({
                status:false,
                error: err
             })
        })

       } catch (err) {
        console.error(err)
        res.json({
            status:false,
            error: err
         })
       }
    }
    )


router.get('/get-all-products', (req,res) => {
   try {
    productRef.once('value', (snapshot) => {
        if(snapshot.val()) {
           const products = [];
           snapshot.forEach((x)=>{
            products.push(x.val())
           })

           res.json({
            status: true,
            data: products
           })
        } else {
            res.json({
                status: false,
                error: "No Product In Database!"
               })
        }
    })
   } catch (err) {
       res.json({
            status: false,
            error: err
       })
   }
})  

router.get('/get-product-by-id', (req,res) => {
    const query = req.query;
    try {
     productRef.orderByChild('id').equalTo(query.id).once('value', (snapshot) => {
         if(snapshot.val()) {
            const products = [];
            snapshot.forEach((x)=>{
             products.push(x.val())
            })
 
            res.json({
             status: true,
             data: products
            })
         } else {
             res.json({
                 status: false,
                 error: "No Product In Database!"
                })
         }
     })
    } catch (err) {
        res.json({
             status: false,
             error: err
        })
    }
 })  

module.exports = router;