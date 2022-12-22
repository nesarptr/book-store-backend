const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");

const app = express();

const PORT = process.env.PORT || 8080;

app.use(helmet());

app.use("/", (_, res) => {
  res.status(200).json({
    message: `Hello World`,
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.smk9kza.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(PORT);
  })
  .catch((e) => {
    console.log(e);
  });
