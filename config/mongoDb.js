const mongoose = require('mongoose');




const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://sumi_22346:sk123@cluster0.t2kdn8k.mongodb.net/ecom');
    console.log('MongoDB connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
