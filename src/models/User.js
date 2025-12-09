const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    preferredCategories: [String]
});


module.exports = mongoose.model('User', UserSchema);