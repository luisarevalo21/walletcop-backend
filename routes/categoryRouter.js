const express = require("express");
const router = express.Router();
const Category = require("../models/categories.js");

router.get("/", async (req, res) => {
  try {
    const results = await Category.find();
    return res.status(200).json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

module.exports = router;
