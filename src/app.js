const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const firebase_admin = require('firebase-admin');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// Initializing Firebase Admin SDK
const serviceAccount = require('./serviceAccount.json');

const admin = firebase_admin.initializeApp({
  credential: firebase_admin.credential.cert(serviceAccount),
  databaseURL: 'https://kidfootball-cf306-default-rtdb.europe-west1.firebasedatabase.app',
  storageBucket: 'lineup-market.appspot.com',
});

// Initialize The App
const app = express();
// const { checkSubscriptionExpirations } = require('./functions/cron');

// -----------   3rd Party Libraries Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// --------  Middlewares  --------
const middlewares = require('./middleware/index');

app.get('/', (req, res) => {
  res.json(["😀", "😳", "🙄"])
})

// Auth
// Authentication Apis
app.use('/auth', require('./api/auth/auth'))

// Classes
app.use('/classes',require('./api/classes/classes'))


app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

// Tasks (Firebase Listening For Realtime Events)
// require("./tasks/pplRequests");

// Cron Job 
// require("./functions/checkOrderTimeJob");

module.exports = app;
