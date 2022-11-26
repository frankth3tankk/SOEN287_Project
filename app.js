//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { forEach, find } = require('lodash');


const homeStartingContent = "Dear Students, Welcome to this edition of SOEN287 - Web Programming.\n My name is Abdelghani and I will be facilitating this course this Fall 2022. \n This is an introduction course on Web programming. The course will include discussions and explanations of the following topics: \nInternet architecture and protocols; Web applications through clients and servers; markup languages; client-side programming using scripting languages; static website contents and dynamic page generation through server-side programming; preserving state in Web applications. \nRegards, \nAbdelghani Benharref.";
const professorContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

//const PORT = process.env.PORT || 3030;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "This is a key for the cookie",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb+srv://admin-parsa:Parsa1234@cluster0.v6lcnxb.mongodb.net/soen287proj' })
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-parsa:Parsa1234@cluster0.v6lcnxb.mongodb.net/soen287proj", {useNewUrlParser: true});



/**************************
  --- Database Models --- 
**************************/

// ================ User Schema ================ 
const userSchema = new mongoose.Schema ({
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


// ================ Post Schema ================ 
const postSchema = new mongoose.Schema ({
  title: String,
  content: String
});
const Post = mongoose.model("Post", postSchema);

// ============== Assessment Schema ============== 
const assessmentSchema = new mongoose.Schema ({
  name: String,
  totalMarks: Number,
  weight: Number,
});
const Assessment = mongoose.model("Assessment", assessmentSchema);

// =============== Student Schema =============== 
const studentSchema = new mongoose.Schema ({
  name: String,
  studentID: Number,
  username: String
})
const Student = mongoose.model("Student", studentSchema);

// =============== Professor Schema =============== 
const profSchema = new mongoose.Schema ({
  fullname: String,
  description: String,
  username: String
})
const Professor = mongoose.model("Professor", profSchema);

// ================ Grade Schema ================ 
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






// =========== Home Route ===========
app.get("/", async (req, res) => {

let posts = await Post.find({});

if (req.isAuthenticated()) {

  res.render("home", {
    startingContent: homeStartingContent,
    posts: posts,
    user: req.user
    });
} else {
res.redirect("/login");
}

});

// =========== User Route ===========
app.get("/user/:userid", async (req, res) => {
  const requestedUserId = req.params.userid;
  
  if (req.isAuthenticated() && req.user.role == "Student") {
    let student = await Student.findOne({username: requestedUserId});
    res.render("user", {
      student: student,
      user: req.user
    });

  } else if (req.isAuthenticated() && req.user.role == "Teacher"){
    let prof = await Professor.findOne({username: requestedUserId});
    res.render("user", {
      prof: prof,
      user: req.user
    });

  } else {
    res.redirect("/login");
    }

});

// =========== Help Route ===========
app.get("/help", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("help", {user: req.user});
  } else {
  res.redirect("/login");
  }
});

// =========== Professor Route ===========
app.get("/professor", async (req, res) => {

  // send only the logged-in teacher's info
  if (req.isAuthenticated() && req.user.role === "Teacher") {
    let thisProf = await Professor.findOne({username: req.user.username});
    res.render("professor", {
      thisprof: thisProf,
      user: req.user
    });
  }

  // send all teachers info
  else if  (req.isAuthenticated()) {
    let professors = await Professor.find({});
    res.render("professor", {
      professors: professors,
      user: req.user
    });
  }

  else {
    res.redirect("/login");
    }
});


// =========== Edit Professor ===========
app.post("/editProfessor/:profid", async (req, res) => {
  
  try{

    let prof = await Professor.findById(req.params.profid);
    await prof.updateOne({
      fullname: req.body.fullname,
      description: req.body.description
    });

  } catch (err) {
    return console.log(err);
  }

  res.redirect("/professor");

});


// ========= Teacher's Lounge =========
app.get("/teacherLounge", (req, res) => {
  if (req.isAuthenticated() && req.user.role === "Teacher"){
    res.render("teacherLounge", {
      user: req.user
    });
  }else {
    res.redirect("/login");
    }
});


// =========== Post Route ===========
app.get("/post/:postid", (req, res) => {
  const requestedPostId = req.params.postid;

  if (req.isAuthenticated()){
    Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("post", {
        post: post,
        user: req.user
        });
    });
  }else {
    res.redirect("/login");
    }
});


// =========== Manage Posts ===========
app.get("/managePosts", async (req, res) => {


  let posts = await Post.find({});
  
  if (req.isAuthenticated() && req.user.role === "Teacher"){

    res.render("managePosts", {
      user: req.user,
      posts: posts
    });
  }else {
    res.redirect("/login");
    }
});


/*********************************
 edit, delete and submit a post 
 *********************************/

app.post("/editPost/:postid", async (req, res) => {
  const requestedPostId = req.params.postid;
  const doc = await Post.findOne({ _id: requestedPostId });
  const update = { content: req.body.postBody, title: req.body.postTitle };
  await doc.updateOne(update);

  res.redirect("/managePosts");
});

app.post("/deletePost/:id", (req, res) => {
  const requestedId = req.params.id;
  Post.findByIdAndRemove({_id:requestedId} , function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/managePosts");
    }
  })
});

app.post("/newPost", async function(req, res){
  
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



/************************
Student's Assessment Page
*************************/

app.get("/myAssessments", async (req, res) => {
  let grades
  let lettergrades = [];
  let classAverage = [];
  let classGrades


  // If the logged in user is a student
  if (req.isAuthenticated() && req.user.role == "Student"){
  // find the student 
  let student = await Student.findOne({username: req.user.username});
  // find the grades and populate the student and assessment refrences (to be able to access their data)
  grades = await Grade.find({student:student}).populate('student').populate('assessment');
  console.log("grades are: "+grades); // this line is for error checking
  } else {
    redirect("/login");
  }

  // for each assessment of this student
  for(let grade of grades){
    // compute and populate the lettergrades array
    lettergrades.push(toLetterGrade(grade.mark));

    // find the class average
    classGrades = await Grade.find({assessment: grade.assessment});
    classAverage.push(getAverage(classGrades));
  }

  res.render("myAssessments", {
    grades: grades,
    user: req.user,
    lettergrades: lettergrades,
    classAverage: classAverage
  });

});



/**********************
Teacher assessment page
***********************/

app.get("/manageAssessments", (req, res) => {

  if (req.isAuthenticated() && req.user.role === "Teacher"){
    
    Assessment.find({}, (err, assessments) => {
      res.render("manageAssessments", {
        assessments: assessments,
        user: req.user
      });
    });


  } else {
    res.redirect("/login");
  }
});



/*************************
Assessment submission page
*************************/

app.get("/submitAssessment", (req, res) => { 
  if (req.isAuthenticated() && req.user.role === "Teacher"){

    res.render("submitAssessment", {
      user: req.user
    });

  } else {
    res.redirect("/login");
  }
});

/***************
Assessment Page
****************/

app.get("/assessment/:assid", function(req, res){
  const requestedAssId = req.params.assid;

  if (req.isAuthenticated()){

    Grade.find({assessment: requestedAssId}).populate('student', 'name').populate('assessment').exec(function (err, grades) {
      if (err) return handleError(err); //double check this line of code later

      res.render("assessment", {
        grades: grades,
        average: getAverage(grades),
        user: req.user
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

  // find and send an array of students names.

  if (req.isAuthenticated()){
  Grade.find({assessment: requestedAssId}).populate('student', 'name').populate('assessment').exec(function (err, grades) {
    if (err) return handleError(err);
    res.render("editAssessment", {
      grades: grades,
      user: req.user
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

    // get all students form the database and for each student add a new document to the grades model
    try{
      var students = await Student.find({});
      for(i = 0; i<students.length; i++){
        let grade = await Grade.create({
          assessment: assessment,
          student: students[i]
        });
        await grade.save();
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

  // find all the grades of this assessment
  let grades = await Grade.find({assessment: req.params.assid});

  // update the mark of each grade document
  for (let grade of grades){
    await grade.updateOne({mark: marks.shift()});
  }

    // find and update the assessment info
  let assessment = await Assessment.findById(req.params.assid);
  await assessment.updateOne({
    name: req.body.assname,
    totalMarks: req.body.totalMarks,
    weight: req.body.weight,
  });

  res.redirect("/assessment/"+req.params.assid);

});


/***********************
    Manage Students
************************/

app.get("/manageStudents", async (req, res) => {

  let enrolledStudnets = await Student.find({});

  let basicUsers = await User.find({role: "Basic"});

  if (req.isAuthenticated() && req.user.role === "Teacher") {

    res.render("manageStudents", {
      enrolledStudents: enrolledStudnets,
      basicUsers: basicUsers,
      user: req.user
    });
} else {
  res.redirect("/login");
}

});


/***********************
    Enroll Students
************************/

app.post("/addstudents", async (req, res) => {

  //Get all usernames checked for registration
  let usersToAdd = req.body.usersToAdd.split(' ');

  try{
    for (let index=0; index<usersToAdd.length; index++){  

      // If the username does not already exist in the Student model
      // create and save a new student document using the username
      let exists = await Student.exists({username:usersToAdd[index]});
      if (!exists && usersToAdd[index] > " ") {
        // create a new studentID
        let newSID = await Student.countDocuments({}) + 1000;

        //find the user's name from the user model to add it to the student document
        let user = await User.findOne({username: usersToAdd[index]});

        //update the user document and set it's role to Student
        await user.updateOne({role: "Student"});

        // Create and save the new student
        let newStudent = await Student.create({
        username: usersToAdd[index],
        name: user.name,
        studentID: newSID
        });
        await newStudent.save();    

        // Add a new grade document for each assessment for the new student
        let assessments = await Assessment.find({});
        for (let assessment of assessments){
          let grade = await Grade.create({
            assessment: assessment,
            student: newStudent
          });
          await grade.save();
        }

      }
    }

  } catch(err){
    console.log(err);
    return res.send(err);
  }
  return res.redirect("/manageStudents");

});


/***********************
    Remove Students
************************/

app.post("/removestudents", async (req, res) => {

  let usersToRemove = req.body.usersToRemove.toString().split(' ');
  let length = usersToRemove.length;
  let index = 0;

  try{
    for (index; index<length; index++){
      // If the username exists in the Student model
      // delete the student document using the username
      let exists = await Student.exists({username:usersToRemove[index]});
      if (exists && usersToRemove[index] > " ") {
        // delete the student and save it to deletedStudent
        deletedStudent = await Student.findOneAndDelete({username: usersToRemove[index]});

        // update the user document and set it's role to Basic
        let user = await User.findOne({username: usersToRemove[index]});
        await user.updateOne({role: "Basic"});

        // delete any grade docuemnt with the deletedStudent
        await Grade.deleteMany({student: deletedStudent});
      }   

    }

  } catch(error){
    return res.send(error);
  }
  return res.redirect("/manageStudents");
});





/*******************
 User Authentication
********************/


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


/* --- User Registreation --- */

app.post("/register", async (req, res) => {

  try{
    // Create a new user using the username
    let newuser = await User.register({username: req.body.username}, req.body.password);
    await newuser.updateOne({name: req.body.name});


    // TODO: authenticate teacher registration
    if (Boolean(req.body.isteacher)){
      await newuser.updateOne({role: "Teacher"});

      // Create a new professor document and save it
      let newprof = await Professor.create({
        fullname: req.body.name,
        username: req.body.username,
        description: " "
      });
      await newprof.save();
    } else {
      await newuser.updateOne({role: "Basic"});
    }
    
    // Authenticate user (set a cookie) and render the homepage
    passport.authenticate("local")(req, res, function(){
      res.redirect("/");
    });

  } catch (err){
    console.log(err);
    res.redirect("/register");
  }
  
});


/* --- User Login --- */

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



/****************
 Helper Functions
*****************/

// function to calculate the average of some grade documents
function getAverage(grades){
  let avg = 0;
  let length = grades.length;

  for (let i =0; i<length; i++){
    avg += grades[i].mark;
  }
  avg = avg / length;

  return avg;
}

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



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
