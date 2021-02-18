const express = require("express");
const mongoose = require("mongoose");
const Messages = require("./dbMessages");
const Pusher = require("pusher");
const cors = require("cors");

const connection_url =
  "mongodb+srv://admin:JtOIOvaXD9iEiSdD@cluster0.j6n9y.mongodb.net/whatsappdb?retryWrites=true&w=majority";
const pusher = new Pusher({
  appId: "1158221",
  key: "a968ab106b416a9b97d7",
  secret: "b3bd758c1c2df890271a",
  cluster: "ap2",
  useTLS: true,
});

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = mongoose.connection;
db.once("open", () => {
  console.log("conneted to mongo yeahh");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      console.log(messageDetails);
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    }
  });
});
db.on("error", (err) => {
  console.log("err connecting", err);
});

const app = express();
const port = process.env.PORT || 9000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

app.listen(port, () => console.log(`Listening on localhost:${port}`));
