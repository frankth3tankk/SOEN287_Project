//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const assessmentsContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const professorContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: "This is a secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-parsa:Parsa1234@cluster0.v6lcnxb.mongodb.net/soen287proj", {useNewUrlParser: true});

/* --- Database Models --- */

/* User model */
const userSchema = new mongoose.Schema ({
  userid: Number,
  email: String,
  password: String,
  name: String,
  role: String,
  grades: [Number]
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


/* Post Model */
const postSchema = {
  title: String,
  content: String
};
const Post = mongoose.model("Post", postSchema);

/* Assessment Model */
const assessmentSchema = {
  name: String,
  totalMarks: Number,
  weight: Number,
  grades: [Number]
};
const Assessment = mongoose.model("Assessment", assessmentSchema);

/* Question Schema 
const questionSchema = {
  id: Number,
  mark: Number
}
const Question = mongoose.model("Question", questionSchema);
*/

/* Dummy database values 
const question1 = new Question({
  id : 1,
  mark:
});
const student1 = new Student({
  name: "Parsa",
  assessments:
});
*/

app.get("/", function(req, res){
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
});
app.get("/professor", (req, res) => {
  res.render("professor", {professorContent: professorContent});
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.get("/assessments", (req, res) => {
  res.render("assessments", {assessmentsContent: assessmentsContent});
});

app.get("/teacherAssessments", (req, res) => {

  if (req.isAuthenticated()){
    Assessment.find({}, (err, assessments) => {
      res.render("teacherAssessments", {
        assessments: assessments
      });
    });

  } else {
    res.redirect("/login");
  }
});

app.get("/studentAssessments", (req, res) => {
  Assessment.find({}, function(err, assessments){
  res.render("studentAssessments", {
    assessments: assessments
  });
});
});

app.get("/submitAssessment", (req, res) => {
  res.render("submitAssessment");
});

app.get("/assessment/:assid", function(req, res){

  const requestedAssId = req.params.assid;

  if (req.isAuthenticated()){

  Assessment.findOne({_id: requestedAssId}, function(err, assessment){
    res.render("assessment", {
      assessment: assessment
      });
  });

} else {
  res.redirect("/login");
}
  
});

app.get("/editAssessment/:assid", (req, res) => {
  const requestedAssId = req.params.assid;

  if (req.isAuthenticated()){
    Assessment.findOne({_id: requestedAssId}, function(err, assessment){
      res.render("editAssessment", {
        assessment: assessment
        });
    });
  } else {res.redirect("/login");}
  
});

app.post("/submitAssessment", (req, res) => {
  if (req.isAuthenticated()){

    const assessment = new Assessment({
      name: req.body.assname,
      weight: req.body.weight,
      totalMarks: req.body.totalMarks,
      grades: req.body.grades.split(" ")
    }); 
    assessment.save(function(err){
      if (!err){
        res.redirect("/assessment/"+assessment._id);
      }
    });
  }else {console.log(err);}
});

app.post("/editAssessment", (req, res) => {

  Assessment.findByIdAndUpdate(req.body.assid, {
    name: req.body.assname,
    weight: req.body.weight,
    totalMarks: req.body.totalMarks,
    grades: req.body.grades
  },
  {new: true});
  res.redirect("/assessment/"+req.body.assid);
});
/*
  const assessment = new Assessment({
    name: req.body.assname,
    weight: req.body.weight,
    totalMarks: req.body.totalMarks,
    grades: req.body.grades
  });
    assessment.save(function(err){

    if (!err){
      res.redirect("/assessment/"+assessment._id);
    } else {console.log(err);}
  });
});
  */

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

/* --- User Authentication --- */

app.get("/secrets", function(req, res){
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  if (!req.isAuthenticated()){
    res.render("login");
  } else {
    res.redirect("/");
  }
});
app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { 
      return next(err); 
      }
    res.redirect('/');
  });
});

app.post("/register", function(req, res){
/*
var availableID;
  User.find({}, (err, users) => {
    availableID = users.length;
  });
*/
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });
  
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
