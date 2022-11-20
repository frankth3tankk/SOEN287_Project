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

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { forEach } = require('lodash');
const io = new Server(server);


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

const msgSchema = new mongoose.Schema({
  msg: {
      type: String,
      require: true
  } });

const Msg = mongoose.model('msg', msgSchema);

/* --- Database Models --- */

/* User model */
const userSchema = new mongoose.Schema ({
  userid: Number,
  email: String,
  password: String,
  name: String,
  role: String,
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


/* Post Schema */
const postSchema = new mongoose.Schema ({
  title: String,
  content: String
});
const Post = mongoose.model("Post", postSchema);

/* Assessment Schema */
const assessmentSchema = new mongoose.Schema ({
  name: String,
  totalMarks: Number,
  weight: Number,
  average: Number
});
const Assessment = mongoose.model("Assessment", assessmentSchema);

/* Student Schema */
const studentSchema = new mongoose.Schema ({
  name: String,
  studentID: Number
})
const Student = mongoose.model("Student", studentSchema);

/* Grade Schema */
const gradeSchema = {
  mark: Number,
  student: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Student'
},
  assessment: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Assessment'
  }
}
const Grade = mongoose.model("Grade", gradeSchema);




/* Home route */
app.get(async function(req, res){
try{
  var posts = await Post.find({});
} catch(error){
  res.send(error);
}
res.render("home", {
  startingContent: homeStartingContent,
  posts: posts
  });

/*  Using Callback function:
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
      });
  });
 */ 
})

app.get("/post/:postid", (req, res) => {
  const requestedPostId = req.params.postid;
  
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      post: post
      });
  });
});

/* TODO: handle editing in the same route as posts/:postid 
 Hint: show the form only if the user's role is teacher */
app.get("/editPost/:postid", (req, res) => {
  const requestedPostId = req.params.postid;
  
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("editPost", {
      post: post
      });
  });
});

app.post("/editPost/:postid", async (req, res) => {
  const requestedPostId = req.params.postid;
  const doc = await Post.findOne({ _id: requestedPostId });
  const update = { content: req.body.postBody, title: req.body.postTitle };
  await doc.updateOne(update);

  res.redirect("/");
});

app.post("/delete/:id", (req, res) => {
  const requestedId = req.params.id;
  Post.findByIdAndRemove({_id:requestedId} , function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Successfully deleted the document");
      res.redirect("/");
    }
  })
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

// TODO: The toLetterGrade function doesn't take into account the weight of the assessment.
// You should take another parameter, weight, and scale your lettergrade conditions accordingly.

function toLetterGrade(grade) {
  let LetterGrade = '';

    if (grade >= 85) {
      LetterGrade = "A";
    } else if (grade >= 80) {
      LetterGrade= "A-";
    } else if (grade >= 75) {
      LetterGrade = "B+";
    } else if (grade >= 70) {
      LetterGrade = "B";
    } else if (grade >= 65) {
      LetterGrade = "B-";
    } else if (grade >= 60) {
      LetterGrade= "C+";
    } else if (grade >= 55) {
      LetterGrade = "C";
    } else if (grade >= 50) {
      LetterGrade= "D";
    } else {
      LetterGrade = "F";
    }

  return LetterGrade;
}

/************************
Student's Assessment Page
*************************/

app.get("/studentAssessments/:id", (req, res) => {
  let studentID = req.params.id;
  let lettergrades = [];

  Grade.find({student: studentID}).populate('student').populate('assessment').exec(function(err, grades){

    // compute and populate the lettergrades array
    grades.forEach(function(grade, index){
      lettergrades.push(toLetterGrade(grade.mark));
    });

    res.render("studentAssessments", {
      grades: grades,
      lettergrades: lettergrades
    });
  });

});

app.get("/submitAssessment", (req, res) => {
  res.render("submitAssessment");
});

/**************************
Assessment Page for Teacher
***************************/

app.get("/assessment/:assid", function(req, res){
  const requestedAssId = req.params.assid;

  if (req.isAuthenticated()){

    Grade.find({assessment: requestedAssId}).populate('student', 'name').populate('assessment').exec(function (err, grades) {
      if (err) return handleError(err);
        res.render("assessment", {
          grades: grades
          });
      });

  } else {
    res.redirect("/login");
}
  
});

/********************
 Assessment edit page
*********************/

app.get("/editAssessment/:assid", (req, res) => {
  const requestedAssId = req.params.assid;

  if (req.isAuthenticated()){
  Grade.find({assessment: requestedAssId}).populate('student', 'name').populate('assessment').exec(function (err, grades) {
    if (err) return handleError(err);
    res.render("editAssessment", {
      grades: grades
      });
      
  });

} else {
  res.redirect("/login");
}
  
  
});

/**********************
Submit a new assessment 
***********************/

app.post("/submitAssessment", async (req, res) => {
  if (req.isAuthenticated()){

    // Create a new assessment schema and save it
    const assessment = new Assessment({
      name: req.body.assname,
      weight: req.body.weight,
      totalMarks: req.body.totalMarks
    }); 
    try {
      await assessment.save();
    } catch(error){
      res.status(500).send(error);
    }

    //get all students form the databse and for each student add a new document to the grades model
    try{
      var students = await Student.find({});
      for(i = 0; i<students.length; i++){
        let grade = await Grade.create({
          assessment: assessment,
          student: students[i]
        });
      }
    } catch(error){
      res.send(error);
      }

      res.redirect("/assessment/"+assessment._id);

    } else{
      res.redirect("/login");
    }

});


/**************************************
Edit an assessment and save the grades
***************************************/

app.post("/editAssessment/:assid", async (req, res) => {
  // get all the marks from the from body
  let marks = [];
  marks = req.body.allGrades.split(" ");

  // get all student ID's form the databse
  let studentIDs = [];
    try{
      var students = await Student.find({});
      for(i = 0; i<students.length; i++){
        studentIDs[i] = students[i]._id;
      }
    } catch(error){
      res.send(error);
    }

  let length = studentIDs.length;
  let index = 0;
  for (index; index<length;index++){
    // find the grade schema by searching with a studentID and an assessmentID 
    Grade.findOneAndUpdate(
      {assessment: req.params.assid, student:studentIDs[index]},
      {$set:{mark:marks[index]}},
      {new: true}, 
      function(err, grade){
      if (err) {
        console.log("Something wrong when updating data!");
      }
    });
  }

  res.redirect("/assessment/"+req.params.assid);

});


/* Create a new post */

app.post("/compose", async function(req, res){
  
  const post = await Post.create({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  
  try {
    await post.save();
  } catch(error){
    res.status(500).send(error);
  }
  res.redirect("/");
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






io.on('connection', socket => {
  console.log('a user connected');
  socket.on('disconnect', () => {
      console.log('user disconnected');
  });
  socket.on('chat message', msg => {
    console.log(msg);
      const message = new Msg({msg : msg});
      
      message.save().then(() =>{
        console.log('message saved')
          io.emit('chat message', msg)
      });
  });
}) ;


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
