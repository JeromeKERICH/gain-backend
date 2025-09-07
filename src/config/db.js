const mongoose = require('mongoose');
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/gain';

mongoose.set('strictQuery', false);

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('🔗 MongoDB connected');
}).catch(err => {
  console.error('Mongo connection error:', err);
  process.exit(1);
});

module.exports = mongoose;
