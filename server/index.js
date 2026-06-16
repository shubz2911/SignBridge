const express = require("express");

const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true, 
}

const PORT = process.env.PORT || 3001;

const app = express();

var bodyParser = require('body-parser')

const session = require('express-session')

const flash = require('connect-flash');

const passport= require('passport');

const localStrategy= require('passport-local');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json())

const configuredCors = cors(corsOptions);

app.options('*', configuredCors);

app.use(configuredCors);

const SerpApi = require('google-search-results-nodejs')

const search = new SerpApi.GoogleSearch("3d2f0c869c4835a667441651b484e51df952db85c585a102cd1e2e134a1b9ea0")

app.get("/api", (req, res) => {
    res.json({ message: "Hello from SignBridge server!" });
  });

const sessionConfig={
    secret: 'Thisisasecret',
    resave: false,
    saveUninitialized: true,
    cookie:{
      httpOnly: true,
      sameSite: false,
      expires: Date.now()+1000*60*60*24*7,
      maxAge: 1000*60*60*24*7
    }
  }
  const User = require("./models/userschema");
  app.use(session(sessionConfig));
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new localStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  
  const mongoose = require("mongoose");
  const url= 'mongodb://localhost:27017/signbridge'
  const connect = mongoose.connect(url, { useNewUrlParser: true });


app.post('/login', configuredCors, passport.authenticate('local',{successRedirect:""}),(req,res)=>{
  res.json({user:req.user.username});
});

app.post('/register', configuredCors, async (req,res)=>{
  const {email, username, password}= req.body;
  const nu = new User({email, username});
  const regdUser= await User.register(nu, password);
  res.json({user: regdUser.username});
});

app.post('/mastered', configuredCors, async (req,res)=>{
   await User.findOneAndUpdate({username: req.user.username},{$addToSet:{mastered:[req.body.mastered]}});
   let user = await User.find({username:req.user.username});
   console.log(user);
   res.json({success: true});
});

app.get('/results', configuredCors, (req,res)=>{
  search.json({
     engine:"google_jobs",
     q: "deaf", 
     location: "Delhi, India"
    }, (result) => {
      res.json({result : result.jobs_results});
    })
 });
app.get('/blogresult', (req,res)=>{
  search.json({
     q: "Sign Language Blogs", 
    }, (result) => {
     res.json({result : result.organic_results});
    })
 });

const Volunteer = require('./models/volunteerschema.js');
app.post('/volunteer', configuredCors, async (req,res)=>{
  console.log(req.body);
  let nv= new Volunteer({username:req.user.username,full_name: req.body.full_name,email:req.body.email, reason: req.body.reason,image:req.body.image});
  await nv.save();
  res.json({success: true});
});
app.get('/getvols', async (req,res)=>{
  let vols= await Volunteer.find({});
  res.json({volunteers:vols});
});

app.listen(PORT, () => {
  console.log(`SignBridge Server listening on ${PORT}`);
});