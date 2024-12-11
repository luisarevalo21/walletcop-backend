const express = require("express");
const router = express.Router();
const Card = require("../models/cards.js");
const User = require("../models/user.js");
router.get("/", async (req, res) => {
  try {
    const results = await Card.find({});
    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch cards" });
  }
});

router.get("/card/:cardId", async (req, res) => {
  const { cardId } = req.params;

  try {
    const result = await Card.find({
      _id: cardId,
    });

    console.log("result", result);

    return res.status(200).json(result[0]);
  } catch (err) {
    console.log(err);
  }
});

router.get("/:userId", async (req, res) => {
  console.log("get was called");
  const { userId } = req.params;
  try {
    const usersCards = await User.find({
      id: userId,
    }).select({
      cards: 1,
    });

    if (usersCards.length === 0) {
      return res.json({ cards: [] });
    }

    return res.status(200).json(usersCards);
  } catch (err) {
    console.log(err);
  }
});

router.get("/:bankName", (req, res) => {
  // const filteredBanks = await Bank.
});
module.exports = router;
