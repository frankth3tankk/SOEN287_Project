function addstudents(){

    // find all the users that are checked to be enrolled
    let usersToAdd = document.getElementsByName('usersToEnroll');  
    let joinedUsers = "";

    for (let user of usersToAdd) {  
        if (user.checked)  {
        joinedUsers += user.value + " ";
        }
    }  

    console.log("joinedUserstoAdd: " + joinedUsers)
    // Create and append a hidden input to pass all the users to be added in one string
    let newInput = document.createElement("input")
    newInput.setAttribute("type", "hidden");
    newInput.setAttribute("name", "usersToAdd");
    newInput.setAttribute("value", joinedUsers);

    document.getElementById("enrollstudentsform").appendChild(newInput);
}

function removestudents(){

        // find all the users that are checked to be removed
        let usersToRemove = document.getElementsByName('usersToRemove');  
        let joinedUsersRemove = " ";
    
        for (let user of usersToRemove) {  
            if (user.checked)  {
            joinedUsersRemove += user.value + " ";
            }
        }  

    
        // Create and append a hidden input to pass all the users to be added in one string
        let newInput = document.createElement("input")
        newInput.setAttribute("type", "hidden");
        newInput.setAttribute("name", "usersToRemove");
        newInput.setAttribute("value", joinedUsersRemove);
    
        document.getElementById("removestudentsform").appendChild(newInput);

}

