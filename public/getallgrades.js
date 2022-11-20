function getallgrades() {
    console.log("Hello?");
    
    // Retrieve all form dom objects.
    // Every element except the first three and the last two are grades.
    var x = document.getElementById("gradestable");

    var allGrades = "";
    var i;
    for (i = 3; i < x.length-2; i++) {
        allGrades = allGrades + x.elements[i].value + " ";
    }

    //set the last input (allGrades)'s value to all the grades to be sent to the database.
    x.elements[x.length-2].value = allGrades;
  }