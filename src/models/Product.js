const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, index: true },
    tags: [String],
    price: Number,
    image: String,
    popularity: { type: Number, default: 0 }
});


module.exports = mongoose.model('Product', ProductSchema);