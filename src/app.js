const fs = require("fs");
const path = require("path");

const IslandISLogin = require("../index.js");

const loginIS = new IslandISLogin({
    kennitala: "5207170800",
    verifyDates: false,
});

const rawToken = fs.readFileSync(
    path.resolve(__dirname, "../temp/token.txt"),
    "utf8"
);

loginIS
    .verify(rawToken)
    .then(user => {
        // do stuff
        console.log("This is result: ");
        console.log(user);
    })
    .catch(err => {
        // do stuff
        console.log("Error verifying token");
        console.log(err);
    });
