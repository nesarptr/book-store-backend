const path = require("path");
const crypto = require("crypto");

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const multer = require("multer");

const isAuthenticated = require("./middleware/is-auth");
const authRoutes = require("./routes/auth");
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const Throw = require("./utils/throw");

const PORT = process.env.PORT || 8080;
const app = express();

const storage = multer.diskStorage({
  destination: (_, _, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString() +
        crypto.randomBytes(32).toString("hex") +
        "-" +
        file.originalname
    );
  },
});

const fileFilter = (_, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(helmet());
// ! Handling CORS
app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(multer({ storage, fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/admin", isAuthenticated, adminRoutes);
app.use("/api/v1/shop", isAuthenticated, shopRoutes);

app.use("/", () => {
  Throw.NotFoundError();
});

app.use((error, _, res, __) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.smk9kza.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((e) => {
    console.log(e);
  });
