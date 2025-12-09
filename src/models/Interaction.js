const mongoose = require('mongoose');
const InteractionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    type: { type: String, enum: ['view','click','purchase','wishlist'] },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Interaction', InteractionSchema);