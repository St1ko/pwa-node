const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const webpush = require("web-push");
const fs = require("fs");

const app = express();

dotenv.config();

app.use(cors());
app.use(bodyParser.json());

webpush.setVapidDetails(
  process.env.WEB_PUSH_CONTACT,
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.post("/notifications/subscribe", (req, res) => {
  const subscription = req.body;

  fs.readFile("subscribers.json", (err, data) => {
    const subscribers = JSON.parse(data);
    subscribers.push(subscription);

    fs.writeFile("subscribers.json", JSON.stringify(subscribers), (err) => {
      if (err) throw err;
      console.log("New subscription appended to subscribers.json");
    });
  });

  const payload = JSON.stringify({
    title: "Hey there!",
    body: "You are now subscribed to push notifications.",
  });

  webpush
    .sendNotification(subscription, payload)
    .then((result) => console.log(result))
    .catch((e) => console.log(e.stack));

  res.status(200).json({ success: true });
});

app.post("/notifications/send", (req, res) => {
  ({ title, message } = req.body);

  fs.readFile("subscribers.json", (err, data) => {
    const subscribers = JSON.parse(data);

    for (let subscriber of subscribers) {
      const pushSubscription = {
        endpoint: subscriber.endpoint,
        keys: subscriber.keys,
      };

      webpush
        .sendNotification(
          pushSubscription,
          `{"title":"${title}","message":"${message}"}`
        )
        .then((result) => {
          console.log(`Message send to ${pushSubscription.endpoint}`);
        })
        .catch((e) => {
          console.log(`Message not send to ${pushSubscription.endpoint}`);
        });
    }
  });

  res.status(200).json({ success: true });
});

app.listen(9000, () =>
  console.log("The server has been started on the port 9000")
);
