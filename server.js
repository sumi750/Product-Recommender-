const dotenv = require('dotenv');
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/mongoDb.js');
const cors = require('cors');
const mongoose = require('mongoose');


const recommendRoute = require('./src/routes/recommend.js');


const app = express();
dotenv.config();

//connect to Db
connectDB();

app.use(cors());
app.use(express.json());


const PORT = process.env.PORT | 4000;

app.use('/api/recommend', recommendRoute);

app.get('/', (req, res) => res.send('Ecom Recommender API'));

app.listen(PORT, () => console.log(`Server running on ${PORT}`));