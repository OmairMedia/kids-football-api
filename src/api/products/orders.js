const express = require("express");
const { body, validationResult } = require("express-validator");
const moment = require("moment");
const {
  usersRef,
} = require("../../db/ref");


const saltRounds = 10;
const bcrypt = require("bcrypt");

const router = express.Router();

router.post('create-order',
  body("fullname").withMessage("Fullname must be less than 20 characters"),
  body("email").isEmail().withMessage("Invalid Email !"),)


module.exports = router;