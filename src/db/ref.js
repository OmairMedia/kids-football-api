const { getDatabase } = require('firebase-admin/database');
const db = getDatabase();


// Users Related
const usersRef = db.ref('users');


// Product Related
const productRef = db.ref('products');

module.exports = {
  usersRef,
  productRef
};
