require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

const { requireAuth } = require("@clerk/express");
const connectDB = require("./db/index");
const cardRouter = require("./routes/cardRouter");
const categoryRouter = require("./routes/categoryRouter");
const bankRouter = require("./routes/bankRouter");
const userRouter = require("./routes/userRouter");
const User = require("./models/user");
const Category = require("./models/categories");
const helmet = require("helmet");
app.use(helmet());

connectDB();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// app.use(express.static("public"));
app.use(
  cors({
    // origin: process.env.CLIENT_URL || ["http://localhost:5173", "https://generous-similarly-marmoset.ngrok-free.app"],
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "https://walletcop.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  try {
    // Verify JWT token using Supabase JWT secret
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// app.get("/", (req, res) => {
//   console.log("hello");
// });
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/auth-state", (req, res) => {
  const authState = req.auth;
  return res.json(authState);
});

app.get("/protected", requireAuth(), (req, res) => {
  res.send("This is a protected route");
});

const addCategoryData = async () => {
  const defaultCategoryNames = ["Gas", "Dining", "Groceries", "Travel"]; // Replace with your default names
  const defaultCategories = await Category.find({
    category: { $in: defaultCategoryNames },
  });
  return defaultCategories.map(category => {
    return {
      categoryName: category.category,
      categoryId: category._id,
    };
  });
};
const saveUserToDB = async userData => {
  // console.log("saving to db");

  try {
    const existingUser = await User.findOne({ email: userData.email });
    // console.log("extisint user", existingUser);

    if (existingUser?.favorites?.length === 0) {
      const categories = await addCategoryData();
      existingUser.favorites = categories;
      await existingUser.save();
    }
    if (!existingUser) {
      const newUser = new User({ ...userData });

      await newUser.save();
      return newUser;
    }

    if (existingUser) {
      return existingUser;
    }
    // const newUser = new User({
    //   ...existingUser,
    // });
    // return newUser;
  } catch (err) {
    console.log("err", err);
    // console.log(err);
    if (err.code === 11000) {
      const foundUser = await User.findOne({
        email: userData.email,
      });

      if (foundUser?.favorites?.length === 0) {
        const categories = await addCategoryData();
        foundUser.favorites = categories;
        await foundUser.save();
      }
      return foundUser;
    }
  }
};

app.post("/auth/callback", authenticateUser, async (req, res) => {
  const { sub: userId, email } = req.user;
  const { full_name: name, avatar_url } = req.user.user_metadata;

  // console.log("inside auth callback");
  const [firstName, lastName] = name.split(" ");

  const userData = {
    userId,
    email,
    firstName,
    lastName,
    imageUrl: avatar_url,
  };
  try {
    const user = await saveUserToDB(userData);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error processing auth callback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware function
// app.use((err, req, res, next) => {
//   // console.log("error occured");
//   // console.error(err.stack);
//   return res.status(401).send("Unauthenticated!");
// });

app.use("/user", authenticateUser, userRouter);
app.use("/banks", authenticateUser, bankRouter);
app.use("/cards", authenticateUser, cardRouter);
app.use("/categories", authenticateUser, categoryRouter);
// app.use("/cards", requireAuth(), cardRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
