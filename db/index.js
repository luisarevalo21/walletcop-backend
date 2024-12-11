const mongoose = require("mongoose");

const dbURI = process.env.DB_URI;
const connectDb = async () => {
  try {
    const res = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");
  } catch (error) {
    console.error(error);
  }
};

module.exports = connectDb;
