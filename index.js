const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")('sk_test_51OEnfwEKCviqmDKyGvNejduojyz7gGGaSNsgAYpLbIHo4YyC0qKaxo7lbJZOVs8nU1pzYL1TtCdLmF4HlpmBSycY00vTAdpl3R');

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
  const paymentCollection = mongoose.model('payments', new mongoose.Schema({}, { strict: false }));
  const responseCollection = mongoose.model('response', new mongoose.Schema({}, { strict: false }));

  // const surveyCollection = mongoose.model('survey', surveySchema);

  // Routes and other configurations...
  app.get('/survey', async (req, res) => {
    const result = await surveyCollection.find();
    res.send(result)
  })

  // ---------------------allUserInfo-------------------------

  app.get('/allActiveUser', async (req, res)=>{
    const result = await userCollenction.find()
    console.log(result)
    res.send(result)
  })

  // ----------------------paymentInfo---------------------------
  app.get('/paymentData', async (req, res)=>{
    const result = await paymentCollection.find()
    console.log(result)
    res.send(result)
  })

  // ------------------------AllServeyRes--------------------------------

  app.get('/allserveyresponse', async (req, res)=>{
    const result = await responseCollection.find()
    console.log(result)
    res.send(result)
  })

  // ------------------deleteSurvey----------------------------

  app.delete('/deleteSurvey', async (req, res)=>{
    const id = req.query.id;
    console.log(id)
    const result = await surveyCollection.deleteOne({ _id: new Object(id)});
    res.send(result)
  })

  // ------------------------------------updateSurvey------------------------------
  app.patch('/updateSurvey', async(req, res)=>{
    const id = req.query.id;
    const data = req.body;
    console.log(id, data)

    const result = await surveyCollection.updateOne(
      { _id: new Object(id) },
      { $set: { category: data.category, description: data.description, questionOne: data.questionOne, title: data.title } },
    );

    res.send(result)
  })

  // --------------------------------userFeedback-------------------------------------

  app.post('/feedback', async (req, res)=>{
    const id = req.query.id;
    const feedbackReport = req.body;
    console.log(id, feedbackReport)

    const update = await surveyCollection.updateOne(
      { _id: new Object(id) },
      {
        $push: { feedback: feedbackReport},
      },
    );

    res.send(update);
  })

  // --------------------------------userWiseSurveyCollection--------------------------------
  app.get('/userwisesurver', async (req, res)=>{
    const email = req.query.email;
    const result = await surveyCollection.find({ surveyor: email })
    res.send(result)
  })

  // --------------------------------surveyResponseCollection----------------------------------

  app.post('/surveyres', async (req, res)=>{
    const surveyRes = req.body;
    const result = await responseCollection.create(surveyRes);
    res.send(result)
  })

  app.get('/surveyres', async (req, res)=>{
    const email = req.query.email;
    const result = await responseCollection.find({surveyor: email});
    res.send(result)
  })

  // -----------------------------------------------------DashboardApi------------------------------------------------

  app.post('/createsurvey', async(req, res)=>{
    const data = req.body;
    const result = await surveyCollection.create(data)    
    res.send(result);
  })

  // ------------------------------paymentTokenCreate------------------------------
  app.post('/create-payment-intent', async (req, res)=>{
    const {price} = req.body;
    const amount = parseInt(price*100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount : amount,
      currency: 'usd',
      payment_method_types: [
        'card'
      ]
    })
    res.send({
      clientSecret: paymentIntent.client_secret,
    })
  })

  // -------------------------------------confirmPayment---------------------------------------------

  app.post('/payment', async (req,res)=>{
    const paymentInfo = req.body;
    const userInfo = paymentInfo.email;
    const result = await paymentCollection.create(paymentInfo);
    
    const update = await userCollenction.updateOne(
      { email : userInfo },
      { $set: { role: 'proUser' } },
    );
    res.send({result, update})

  })

  // -------------------------userRole------------------------------
  app.get('/role', async (req, res)=>{
    const email = req.query.user;
    const result = await userCollenction.findOne({email: email});
    res.send(result);
  })


  // -------------------------------like----------------------------
  app.post('/likes', async(req,res)=>{
    const user = req.query.user;
    const value = req.query.value;
    const id = req.query.id;
    const survey = await surveyCollection.findById(id)

    if(value === 'true'){
      console.log('from true', value)

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
      if (survey.dislikesBy.includes(user)) {
        await surveyCollection.updateOne(
          { _id: new Object(id) },
          {
            $inc: { 'dislike': -1 },
            $pull: { dislikesBy: user},
          }
        );
      }
      return res.send(result)
    }

    if(value === 'false'){

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
 

  // ----------------------------------------disLike----------------------------------------

  app.post('/dislike', async(req,res)=>{
    const user = req.query.user;
    const value = req.query.value;
    const id = req.query.id;
    const survey = await surveyCollection.findById(id)

    if(value === 'true'){

      if (survey.dislikesBy.includes(user)) {
        return res.send('already disliked')
      }
      
      const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'dislike': 1 },
          $push: { dislikesBy: user},
        }
      );

      if (survey.likesBy.includes(user)) {
        await surveyCollection.updateOne(
          { _id: new Object(id) },
          {
            $inc: { 'like': -1 },
            $pull: { likesBy: user},
          }
        );
      }

      return res.send(result)
    }

    if(value === 'false'){

      

       const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'dislike': -1 },
          $pull: { dislikesBy: user},
        }
      );
      return res.send(result)
    }



    res.send('data');
  })

  // ------------------------------------------disLikeEnd------------------------------------

  // ------------------------------commentStart---------------------------------

  app.post('/comment', async(req, res)=>{
    const userCommnet = req.body;
    const id = req.query.id;

    const result = await surveyCollection.updateOne(
      { _id: new Object(id) },
      {
        $push: { comment: userCommnet},
      }
    );

    res.send(result)
  })

  // ----------------------------------------commentEnd----------------------------------------

  app.post('/users', async (req, res) => {
    const user = req.body;
    const email = user.email;
    const query = { email: email };
    const isExists = await userCollenction.findOne(query);

    if (isExists) {
      return res.send({ massege: 'user already exists' });
    }
    const result = await userCollenction.create(user);
    res.send(result);
  });

  app.get('/details/:id', async (req, res) => {
   
    const id = req.params.id;
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

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    if (survey.voted.includes(email)) {
      return res.send('already voted')
    }

    if (vote === 'yes') {
      totalVote = survey.vote.yes + 1;
      survey.voted.push(email)

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

      const result = await surveyCollection.updateOne(
        { _id: new Object(id) },
        {
          $inc: { 'vote.no': totalVote },
          $push: { voted: email},
        }
      );
      return res.send(result)
    }

    res.send('num')
  })

});

app.get('/', (req, res) => {
  res.send('survey is running');
});

app.listen(port, () => {
  console.log(`survey Server is running on port ${port}`);
});