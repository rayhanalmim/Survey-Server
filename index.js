const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 5000;

// hfguIfTfUMDQCkF6
// surveySphere

app.use(cors())
app.use(express.json())

const uri = 'mongodb+srv://surveySphere:hfguIfTfUMDQCkF6@cluster0.tdvw5wt.mongodb.net/surverSp?retryWrites=true&w=majority';

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

  // const surveySchema = new mongoose.Schema({
  //   title: { type: String, required: true },
  //   description: { type: String, required: true },
  //   questionOne: { type: String, required: true },
  //   like: { type: Number, default: 0 },
  //   dislike: { type: Number, default: 0 },
  //   category: { type: String, required: true },
  //   surveyor: { type: String, required: true },
  //   vote: {
  //     yes: { type: Number, default: 0 },
  //     no: { type: Number, default: 0 },
  //   },
  //   voted: { type: [String], default: [] },
  //   timestamp: { type: Date, default: Date.now },
  // });

  const surveyCollection = mongoose.model('survey', new mongoose.Schema({}, { strict: false }));
  const userCollenction = mongoose.model('users', new mongoose.Schema({}, { strict: false }));

  // const surveyCollection = mongoose.model('survey', surveySchema);

  // Routes and other configurations...
  app.get('/survey', async (req, res) => {
    const result = await surveyCollection.find();
    res.send(result)
  })

  // -------------------------------like----------------------------
  app.post('/likes', async(req,res)=>{
    const user = req.query.user;
    const value = req.query.value;
    const id = req.query.id;
    const survey = await surveyCollection.findById(id)
    console.log(value)

    if(value === 'true'){
      console.log('from true', value)
      console.log(survey.like)
      if (survey.likesBy.includes(user)) {
        return res.send('already liked')
      }
      const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'like': 1 },
          $push: { likesBy: user},
        }
      );
      return res.send(result)
    }

    if(value === 'false'){
      console.log('from false',value, user)

       const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'like': -1 },
          $pull: { likesBy: user},
        }
      );
      return res.send(result)
    }



    res.send('data');
  })

  app.post('/users', async (req, res) => {
    const user = req.body;
    console.log(user)
    const email = user.email;
    const query = { email: email };
    const isExists = await userCollenction.findOne(query);
    console.log(isExists)

    if (isExists) {
      return res.send({ massege: 'user already exists' });
    }
    const result = await userCollenction.create(user);
    res.send(result);
  });

  app.get('/details/:id', async (req, res) => {
   
    const id = req.params.id;
    console.log(id);
    const query = { _id: new Object(id) };
    const result = await surveyCollection.findOne(query);
    res.send(result)
  })

  // --------------------------------ParticipateSurvey----------------------------
  app.post('/survey', async (req, res) => {
    const email = req.query.email;
    const vote = req.query.res;
    const id = req.query.surveyId;

    const survey = await surveyCollection.findById(id)
    console.log(survey)

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    if (survey.voted.includes(email)) {
      return res.send('already voted')
    }

    if (vote === 'yes') {
      totalVote = survey.vote.yes + 1;
      survey.voted.push(email)
      console.log(survey)

      const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'vote.yes': totalVote },
          $push: { voted: email},
        }
      );
      return res.send(result)
    }

    if (vote === 'no') {
      totalVote = survey.vote.no + 1;
      survey.voted.push(email)
      console.log(survey)

      const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'vote.no': totalVote },
          $push: { voted: email},
        }
      );
      return res.send(result)
    }

    console.log(email, vote, id);
    res.send('num')
  })

});

app.get('/', (req, res) => {
  res.send('survey is running');
});

app.listen(port, () => {
  console.log(`survey Server is running on port ${port}`);
});