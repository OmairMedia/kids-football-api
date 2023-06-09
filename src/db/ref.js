const { getDatabase } = require('firebase-admin/database');
const db = getDatabase();


// Users Related
const adminRef = db.ref('admin');
const usersRef = db.ref('users');

// Product Related
const productRef = db.ref('products');

module.exports = {
  usersRef,
  adminRef
};
