const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const app = express();
const { v4: uuidv4 } = require("uuid");
const port = 3000;

const data = JSON.parse(fs.readFileSync("./data.json").toString());
console.log(data);
// setup the ability to see into response bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// setup the express assets path
app.use("/", express.static(path.join(__dirname, "../client")));

// API calls ------------------------------------------------------------------------------------
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/home.html"));
});

app.get("/race", async (req, res) => {
  res.sendFile(path.join(__dirname, "../client/pages/race.html"));
});

app.get("/api/cars", async (req, res) => {
  // using a stream to read the data and send it.
  // const data = fs.createReadStream('./data.json')
  // console.log('Sending the data over the line')
  // data.pipe(process.stdout)
  // data.pipe(res)
  res.send({
    body: data.cars,
  });
});

app.get("/api/tracks", async (req, res) => {
  // using a stream to read the data and send it.
  // const data = fs.createReadStream('./data.json')
  // console.log('Sending the data over the line')
  // data.pipe(process.stdout)
  // data.pipe(res)
  res.send({
    body: data.tracks,
  });
});

app.post("/api/races", async (req, res) => {
  const raceData = req.body;
  const newRaceId = uuidv4();
  const newRace = {
    ...raceData,
    id: newRaceId,
  };
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
