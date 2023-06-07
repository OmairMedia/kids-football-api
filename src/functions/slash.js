const {
  e_walletRef,
  subscribed_usersRef,
  pricingRef,
  userRef,
  heavyref,
  heavyvehref,
  promoRef,
  bidRef,
  sessionsRef,
  userReqRef,
  MessagesRef,
  requests_dataRef,
  commissionRef,
  userLiveRequestsRef,
  notificationKeys,
  feedsRef,
  completeReqRef,
  invoicesClientsRef,
  invoicesDriversRef,
  addaListRef,
  onlineDriversRef,
} = require("../db/ref");

// New Ref
const {
  scmRequestRef,
  scmPricing,
  vehicleListRef,
  scmCommission,
  scmInvoiceRef,
  scmSettingsRef,
  driverHistoryRef,
  pplBiddingsRef,
  pplInvoiceRef,
  pplSettingsRef,
} = require("../db/newRef");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const _ = require("lodash");
const momenttimezone = require("moment");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const { htmlToText } = require("html-to-text");
const juice = require("juice");
const saltRounds = 10;
const bcrypt = require("bcrypt");

// Helper Functions
module.exports = {
  // Get Current Pakistani Time
  getCurrentDate() {
    let currentDate = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Karachi",
      hour12: false,
    });
    return currentDate;
  },
  // Get Current Pakistan Time In Unix Timestamp
  getCurrentTimestamp() {
    let timestamp = momenttimezone.tz("Asia/Karachi").valueOf();
    return timestamp;
  },
  getTimestampFromDate(date) {
    let timestamp = momenttimezone.tz(date, "Asia/Karachi").valueOf();
    return timestamp;
  },
  verifyTokenFirebase(req, res, next) {
    const params = req.body;

    try {
      const idToken = params.token;
      // Verify Token

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const uid = decodedToken.uid;

          req.body.user = decodedToken;
          // console.log('req.body.user -> ',req.body.user)
          next();

          // res.json({
          //   status:true,
          //   data: decodedToken
          // })
          // ...
        })
        .catch((err) => {
          // Handle error
          res.json({
            status: false,
            error: err.message,
          });
        });
    } catch (error) {
      // throw error;
      console.log({ error });
      res.json({
        status: false,
        error: "Invalid Token !",
      });
    }
  },
  CHECK_distance(lat1, lon1, lat2, lon2) {
    const radlat1 = (Math.PI * lat1) / 180;
    const radlat2 = (Math.PI * lat2) / 180;
    const radlon1 = (Math.PI * lon1) / 180;
    const radlon2 = (Math.PI * lon2) / 180;
    const theta = lon1 - lon2;
    const radtheta = (Math.PI * theta) / 180;
    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist *= 1.609344;
    return dist;
  },
  async sendOrderApplicationEmail(
    subject,
    body,
    email,
    orderNo,
    emailReceiver
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECTED },
    });

    const templatePath = `/templates/insuranceEmail.html`;

    const templateVars = {
      currentUploadingDocsUrl: body.currentUploadingDocsUrl,
      InvoiceNo: body.InvoiceNo,
      InvoiceDate: body.InvoiceDate,
      ConsigneeName: body.ConsigneeName,
      Cargo_value: body.Cargo_value,
      Original_cargo_value: body.Original_cargo_value,
      PortofOrigin: body.PortofOrigin,
      PortofArrival: body.PortofArrival,
      FinalDestination: body.FinalDestination,
      grossWeight: body.grossWeight,
      orderNo: orderNo,
    };
    const template = fs.readFileSync(
      path.join(__dirname, templatePath),
      "utf-8"
    );
    const html = ejs.render(template, templateVars);
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);

    console.log("emailReceiver", emailReceiver);

    const info = await transporter.sendMail({
      from: '"Meribilty Admin" <admin@Meribilty.com>', // sender address
      to: `${email},${emailReceiver}`,
      subject: `Meribilty - Insurance For OrderNo#${orderNo}`,
      text: text,
      html: htmlWithStylesInlined,
    });
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  },
  async sendAdminForgotPasswordEmail(email, token) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECTED },
    });

    let templatePath = `/templates/forgotPassword.html`;

    // const salt = bcrypt.genSaltSync(saltRounds);
    // const hash = bcrypt.hashSync(email, salt);

    const templateVars = {
      resetEmailLink: `http://localhost:8080/user/reset-password?token=${token}`,
    };

    const template = fs.readFileSync(
      path.join(__dirname, templatePath),
      "utf-8"
    );

    const html = ejs.render(template, templateVars);
    const text = htmlToText(html);
    const htmlWithStylesInlined = juice(html);

    const info = await transporter.sendMail({
      from: "noreply@Meribilty.com",
      to: `${email}`,
      subject: "Reset your password for meribilty admin account",
      text: text,
      html: htmlWithStylesInlined,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  },
};
