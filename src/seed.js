require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const Interaction = require('./models/Interaction');


const sampleProducts = [
{ title: 'Nike Air Max', category: 'Shoes', tags: ['sports','running'], price: 6999, popularity: 120 },
{ title: 'Adidas Running Tee', category: 'Clothing', tags: ['sports','tee'], price: 999, popularity: 80 },
{ title: 'Sony Headphones', category: 'Electronics', tags: ['audio','headphones'], price: 4999, popularity: 200 },
{ title: 'Kitchen Knife Set', category: 'Home', tags: ['kitchen','cooking'], price: 1299, popularity: 40 },
{ title: 'Running Shorts', category: 'Clothing', tags: ['sports','running'], price: 799, popularity: 60 },
{ title: 'Trail Running Shoes', category: 'Shoes', tags: ['sports','trail','running'], price: 7999, popularity: 90 }
];


async function seed(){
await mongoose.connect('mongodb+srv://sumi_22346:sk123@cluster0.t2kdn8k.mongodb.net/ecom');
console.log('Connected to DB');


await Product.deleteMany({});
await User.deleteMany({});
await Interaction.deleteMany({});


const created = await Product.insertMany(sampleProducts);
console.log('Products created');


const user = await User.create({ name: 'Test User', email: 'test@ex.com', preferredCategories: ['Clothing','Shoes'] });


// create some interactions
await Interaction.create({ userId: user._id, productId: created[0]._id, type: 'view'});
await Interaction.create({ userId: user._id, productId: created[5]._id, type: 'view'});
await Interaction.create({ userId: user._id, productId: created[1]._id, type: 'click'});


console.log('Seed done. User id:', user._id.toString());
process.exit(0);
}


seed().catch(e => console.error(e));