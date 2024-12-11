const express = require("express");
const router = express.Router();
const Bank = require("../models/banks.js");
const Card = require("../models/cards.js");

router.get("/", async (req, res) => {
  try {
    const results = await Bank.find();
    return res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch banks" });
  }
});

router.get("/:bankName", async (req, res) => {
  const { bankName } = req.params;
  try {
    const cards = await Card.find({
      bankName: bankName,
    }).select({
      abbreviation: 1,
      bankName: 1,
      creditCardName: 1,
      _id: 1,
    });

    console.log(cards);
    if (cards.length === 0) {
      return [];
    }
    return res.status(200).json(cards);

    // console.log("banks caleld", req.params.bankName);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
