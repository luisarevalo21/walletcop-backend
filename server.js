require("dotenv").config();

const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");

const { clerkMiddleware, requireAuth } = require("@clerk/express");
const { Webhook } = require("svix");
const connectDB = require("./db/index");
const cardRouter = require("./routes/CardRouter");
const categoryRouter = require("./routes/CategoryRouter");
const bankRouter = require("./routes/bankRouter");
const userRouter = require("./routes/userRouter");
const User = require("./models/user");
const Category = require("./models/categories");
connectDB();

app.use(clerkMiddleware());
// app.use(express.json());

app.use((req, res, next) => {
  if (!req.path.startsWith("/api/webhooks")) {
    express.json()(req, res, next);
  } else {
    next();
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/auth-state", (req, res) => {
  const authState = req.auth;
  return res.json(authState);
});

app.get("/protected", requireAuth(), (req, res) => {
  res.send("This is a protected route");
});

// Error handling middleware function
app.use((err, req, res, next) => {
  console.log("error occured");
  console.error(err.stack);
  return res.status(401).send("Unauthenticated!");
});
app.use("/user", userRouter);
app.use("/banks", requireAuth(), bankRouter);
app.use("/cards", requireAuth(), cardRouter);
app.use("/categories", requireAuth(), categoryRouter);
// app.use("/cards", requireAuth(), cardRouter);
app.post(
  "/api/webhooks",
  // This is a generic method to parse the contents of the payload.
  // Depending on the framework, packages, and configuration, this may be
  // different or not required.
  bodyParser.raw({ type: "application/json" }),

  async (req, res) => {
    const defaultCategoryNames = ["Gas", "Dining", "Groceries", "Travel"]; // Replace with your default names
    const defaultCategories = await Category.find({
      category: { $in: defaultCategoryNames },
    });

    const data = defaultCategories.map(category => {
      return {
        categoryName: category.category,
        categoryId: category._id,
      };
    });

    const SIGNING_SECRET = process.env.SIGNING_SECRET;

    if (!SIGNING_SECRET) {
      throw new Error("Error: Please add SIGNING_SECRET from Clerk Dashboard to .env");
    }
    const payload = req.body;
    const headers = req.headers;

    const wh = new Webhook(SIGNING_SECRET);
    let result = null;
    try {
      result = wh.verify(payload, headers);
    } catch (err) {
      res.status(400).json({});
    }

    if (result.data.user_id) {
      try {
        const userId = result.data.user_id;
        const foundUser = await User.findOne({
          googleId: userId,
        });

        if (foundUser.length !== 0) {
          if (foundUser.favorites.length === 0) {
            foundUser.favorites = data;

            await foundUser.save();
          }
          return res.status(200).json("okay");
        }
      } catch (err) {
        console.log("error", err);
      }
    }

    // Do something with the message...

    const emailAdress = result.data.email_addresses[0].email_address;
    const firstName = result.data.first_name;
    const lastName = result.data.last_name;
    const googleId = result.data.id;
    const imageUrl = result.data.image_url;
    try {
      const foundUser = await User.find({
        email: emailAdress,
      });

      if (foundUser.favorites.length === 0) {
        const defaultFavorites = [
          { categoryName: "Gas", categoryId: null },
          { categoryName: "Dining", categoryId: null },
          { categoryName: "Groceries", categoryId: null },
        ];
        foundUser.favorites = defaultFavorites;
        await foundUser.save();
      }

      if (foundUser.length !== 0) {
        return res.status(200).json("okay");
      }

      const newUser = new User({
        email: emailAdress,
        lastName,
        firstName,
        googleId,
        imageUrl,
      });

      await newUser.save().then(user => {
        res.redirect("/dashboard");
      });
    } catch (err) {
      console.log("error", err);
    }

    // return res.status(200).json("okay");
    // const    =await newUser.save()
    // // User.
    // add user to the db with user info and user model
    //return back the user created to frontend
    // return res.json({
    //   message: result,
    // });
  }
  // }
);

app.post(
  "/api/webhooks/session",
  // This is a generic method to parse the contents of the payload.
  // Depending on the framework, packages, and configuration, this may be
  // different or not required.
  bodyParser.raw({ type: "application/json" }),

  async (req, res) => {
    const SIGNING_SECRET = process.env.SIGNING_SECRET;

    if (!SIGNING_SECRET) {
      throw new Error("Error: Please add SIGNING_SECRET from Clerk Dashboard to .env");
    }
    const payload = req.body;
    const headers = req.headers;

    const wh = new Webhook(SIGNING_SECRET);
    let result = null;
    try {
      result = wh.verify(payload, headers);
    } catch (err) {
      res.status(400).json({});
    }

    try {
      const userId = result.data.user_id;
      const foundUser = await User.find({
        googleId: userId,
      });

      if (foundUser.length !== 0) {
        return res.status(200).json("okay");
      }
    } catch (err) {
      console.log("error", err);
    }
  }
);
// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
