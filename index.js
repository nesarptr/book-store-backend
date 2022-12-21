const express = require("express");

const app = express();

const PORT = process.env.PORT || 8080;

app.use("/", (_, res) => {
  res.status(200).json({
    message: `Hello World`,
  });
});

app.listen(PORT);
