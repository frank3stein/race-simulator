const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
// const { v4: uuidv4 } = require("uuid");


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use("/", express.static(path.join(__dirname, "../client")));

// API calls ------------------------------------------------------------------------------------
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/home.html"));
});

app.get("/race", async (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/race.html"));
});
//not needed as the ids are created in the go server
// app.get("/api/uuid", async (req, res) => {
//   res.send({ id: uuidv4() })
// })

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
