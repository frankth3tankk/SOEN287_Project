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

const app = express();

const PORT = process.env.PORT || 3030;
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
  address: String,
  phone: String
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
  title: String,
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

// =============== Announcement Schema =============== 
const announcementSchema = new mongoose.Schema ({
  title: String,
  content: String
})
const Announcement = mongoose.model("Announcement", announcementSchema);




// =========== Home Route ===========
app.get("/", async (req, res) => {

let posts = await Post.find({});
let announcements = await Announcement.find({});

if (req.isAuthenticated()) {

  res.render("home", {
    startingContent: homeStartingContent,
    posts: posts,
    announcements: announcements,
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

  } else if (req.isAuthenticated()){
    res.render("user", {
      user: req.user
    });
    
  } else {
    res.redirect("/login");
    }

});

// =========== User Edit Page ===========
app.get("/edituser/:userid", async (req, res) => {
  const requestedUserId = req.params.userid;
  
  if (req.isAuthenticated() && req.user.role == "Student") {
    let student = await Student.findOne({username: requestedUserId});
    res.render("editUser", {
      student: student,
      user: req.user
    });

  } else if (req.isAuthenticated() && req.user.role == "Teacher"){
    let prof = await Professor.findOne({username: requestedUserId});
    res.render("editUser", {
      prof: prof,
      user: req.user
    });

  } else if (req.isAuthenticated()){
    res.render("editUser", {
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
      title: req.body.tile,
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


/*************************************
 Edit, delete and submit an Announcement 
 *************************************/

app.post("/announce", async function(req, res){
  
  const post = await Announcement.create({
    title: req.body.subject,
    content: req.body.content
  });
  
  try {
    await post.save();
  } catch(error){
    res.status(500).send(error);
  }
  res.redirect("/");
});

app.post("/editAnnouncement/:id", async (req, res) => {
  const requestedPostId = req.params.id;
  const doc = await Announcement.findOne({ _id: requestedPostId });
  const update = { content: req.body.content, title: req.body.subject };
  await doc.updateOne(update);

  res.redirect("/");
});

app.post("/deleteAnnouncement/:id", (req, res) => {
  const requestedId = req.params.id;
  Announcement.findByIdAndRemove({_id:requestedId} , function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/");
    }
  })
});



/*********************************
 Edit, delete and submit a post 
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
  let medians = [];
  let stddev = [];
  let overall = {
    marks: 0,
    total: 0,
    letterGrade: ''
  };


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
    lettergrades.push(toLetterGrade(grade.mark, grade.assessment.totalMarks));

    // find the class average
    classGrades = await Grade.find({assessment: grade.assessment});
    classAverage.push(getAverage(classGrades));

    //find the median
    medians.push(getMedian(classGrades.map(grade => grade.mark)));

    //find the standard deviation
    stddev.push(getStandardDeviation(classGrades.map(grade => grade.mark)));

    //add to overall grade
    overall.marks += grade.mark/grade.assessment.totalMarks * grade.assessment.weight;
    overall.total += grade.assessment.weight;
  }
  overall.letterGrade = toLetterGrade(overall.marks, overall.total);

  res.render("myAssessments", {
    grades: grades,
    user: req.user,
    lettergrades: lettergrades,
    classAverage: classAverage,
    medians: medians,
    stddev: stddev,
    overall: overall
  });

});



/**********************
Teacher assessment page
***********************/

app.get("/manageAssessments", async (req, res) => {

  if (req.isAuthenticated() && req.user.role === "Teacher"){
    


    let assessments = await Assessment.find({});
    let averages = [];
    
    for (let assessment of assessments) {
      let grades = await Grade.find({assessment: assessment});
      averages.push(getAverage(grades))
    }
    


      res.render("manageAssessments", {
        assessments: assessments,
        averages: averages,
        user: req.user
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
  // find all enrolled students
  let enrolledStudnets = await Student.find({});
  // find all basic users (students who are not enrolled)
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





/***********************
 User Authentication Pages
************************/


app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  if (!req.isAuthenticated()){
    res.render("login", {message: " "});
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


/*******************
 User Registration
********************/

app.post("/register", async (req, res) => {

  try{
    // Throw an error if the secret code is not correct
    if (req.body.isteacher == "Y" && req.body.secretcode != "soen287"){
    throw "Teacher Secret Code is not correct!"
    }

    // Create a new user using the username
    let newuser = await User.register({username: req.body.username}, req.body.password);
    await newuser.updateOne({name: req.body.name});


    // Authenticate teacher registration
    // TODO: Hide the actual secret code
    if (req.body.isteacher == "Y" && req.body.secretcode == process.env.SECRET){
      //Set user role to Teacher
      await newuser.updateOne({role: "Teacher"});

      // Create a new professor document and save it
      let newprof = await Professor.create({
        fullname: req.body.name,
        username: req.body.username,
        description: " "
      });
      await newprof.save();

    }  else {
      //Set user role to Basic if it's not a teacher registeratoin
      await newuser.updateOne({role: "Basic"});
    }
    
    // Authenticate user (set a cookie) and render the homepage
    passport.authenticate("local")(req, res, () => {
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

  passport.authenticate("local",
  (err, user, options) => {
    if (user) {
      // If the user exists log him in:
      req.login(user, (error)=>{
        if (error) {
          res.send(error);
        } else {
          console.log("Successfully authenticated");
          res.redirect("/");
        };
      });
    } else { // If the username and password don't match
      console.log(options.message); // Prints the reason of the failure
      res.render("login", { message: "Username or password incorrect" })
    };
})(req, res)

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

function getMedian(grades){
    grades.sort();
    if(grades.length == 0) return 0;
    //--EVEN number of elements
    if(grades.length % 2 === 0){
      return (grades[grades.length/2 - 1] + grades[grades.length/2])/2;
    }
    //--ODD number of elements
    return grades[(grades.length+1)/2 - 1]
}

function getStandardDeviation (array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

// TODO: The toLetterGrade function doesn't take into account the weight of the assessment.
// You should take another parameter, weight, and scale your lettergrade conditions accordingly.

function toLetterGrade(grade, weight) {
  let LetterGrade = '';
  grade = grade/weight * 100;

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



app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
