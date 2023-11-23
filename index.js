const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 5000;

// hfguIfTfUMDQCkF6
// surveySphere

const uri = 'mongodb+srv://surveySphere:hfguIfTfUMDQCkF6@cluster0.tdvw5wt.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;

  db.on('error', (err) => {
    console.error(`Error connecting to MongoDB: ${err}`);
  });
  
  db.once('open', () => {
    console.log('Connected to MongoDB');
    
    // Define Mongoose models and schemas here...
  
    // Routes and other configurations...
  });

  app.get('/', (req, res) => {
    res.send('survey is running');
  });
  
  app.listen(port, () => {
    console.log(`survey Server is running on port ${port}`);
  });