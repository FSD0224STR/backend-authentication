const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: String,
    email: { type: String, required: true, unique: true },
    confirmed: { type: Boolean, default: false },
}, {timestamps: true});

const userModel = mongoose.model('User', userSchema);

module.exports = { userModel }

