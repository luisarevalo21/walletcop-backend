const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/:userId/newcard", async (req, res) => {
  try {
    const { userId } = req.params;
    const { creditCardId } = req.body;
    const user = await User.findOne({
      googleId: userId,
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const cardExists = user.wallet.some(card => card.creditCardId.equals(creditCardId));

    if (cardExists) {
      return res.status(200).json({ success: false, message: "Card already exists. Try another card." });
    }

    user.wallet.push({
      creditCardId: creditCardId,
    });
    await user.save();

    return res.status(200).json({ success: true, message: "Card added successfully." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add card  " });
  }
});
router.post("/:userId/favorites", async (req, res) => {
  const { userId } = req.params;
  const { cardId, categoryName, categoryId } = req.body;

  if (!userId || !cardId || !categoryName) {
    return res.status(400).json({ message: "no user or card or category" });
  }
  try {
    const user = await User.findOne({
      googleId: userId,
    });

    const favorite = user.favorites.find(fav => fav.categoryId.equals(categoryId));
    if (favorite) {
      favorite.creditCardId = cardId;
      await user.save();
      return res.status(200).json(user.favorites);
    } else {
      return res.status(404).json({ message: "Category not found" });
    }
    // const updatedUser = await
  } catch (err) {
    console.log("error", err);
  }
});

router.post("/:userId/:newCategory", async (req, res) => {
  const { userId, newCategory } = req.params;

  const { categoryId } = req.body;

  if (!userId || !newCategory || !categoryId) {
    return res.status(400).json({ message: "no user or category" });
  }
  try {
    const updatedUser = await User.findOneAndUpdate(
      { googleId: userId },
      { $push: { favorites: { categoryName: newCategory, categoryId } } },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("favorites.creditCardId")
      .exec();

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { favorites } = updatedUser;
    return res.status(200).json(favorites);
  } catch (err) {
    console.log(err);
  }
});

router.delete("/:userId/:categoryId", async (req, res) => {
  const { userId, categoryId } = req.params;

  try {
    const updated = await User.findOneAndUpdate(
      { googleId: userId },
      { $pull: { favorites: { categoryId: categoryId } } },
      { new: true }
    )
      .populate("favorites.creditCardId")
      .exec();

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updated.favorites);
  } catch (err) {
    console.log(err);
  }
});

router.get("/:userId/cards", async (req, res) => {
  const { userId } = req.params;

  console.log("userId", userId);
  try {
    const usersCards = await User.findOne({
      googleId: userId,
    })
      .populate("wallet.creditCardId") // Populate card details
      .exec();

    const returnData = usersCards.wallet.map(card => {
      return { ...card.creditCardId.toObject(), id: card.creditCardId.id };
    });
    // //fix this with object... like above
    // const returnData = usersCards.wallet.map(card => {
    //   return {
    //     abbreviation: card.creditCardId.abbreviation,
    //     bankName: card.creditCardId.bankName,
    //     creditCardName: card.creditCardId.creditCardName,
    //     bonuses: card.creditCardId.bonuses,
    //     benefits: card.creditCardId.benefits,
    //     id: card.creditCardId.id,
    //     imageUrl: card.creditCardId.imageUrl,
    //   };
    // });

    return res.status(200).json(returnData);
  } catch (err) {
    console.log(err);
  }
});

//future feature limit up to 3 cards
router.get("/:userId/cards/:category", async (req, res) => {
  const { userId, category } = req.params;
  try {
    const usersWallet = await User.findOne({
      googleId: userId,
    })
      .populate("wallet.creditCardId")
      .exec();

    const filteredCards = usersWallet.wallet.filter(cardWrapper => {
      const card = cardWrapper.creditCardId;
      return card.category.includes(category);
    });

    const cardsWithCashback = filteredCards.map(cardWrapper => {
      const card = cardWrapper.creditCardId;

      const highestCashbackBonus = card.bonuses
        .filter(bonus => {
          return bonus.categories.includes(category);
        })
        .reduce((max, bonus) => (bonus.value > max ? bonus.value : max), 0); // Get the highest cashback value

      return {
        ...card.toObject(),
        highestCashback: highestCashbackBonus,
      };
    });

    const sortedCards = cardsWithCashback.sort((a, b) => b.highestCashback - a.highestCashback);

    return res.status(200).json(sortedCards);
  } catch (err) {
    console.log(err);
  }
});

router.get("/:userId/favorites", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOne({
      googleId: userId,
    })
      .populate("favorites.creditCardId")
      .exec();
    return res.status(200).json(user.favorites);
  } catch (err) {
    console.log(err);
  }
});

router.delete("/:userId/favorites/:cardId", async (req, res) => {
  const { userId, cardId } = req.params;
  const { categoryId } = req.body;

  if (!userId || !cardId) {
    return res.status(400).json({ message: "no user or card found" });
  }
  try {
    const user = await User.findOneAndUpdate(
      {
        googleId: userId,
        "favorites.categoryId": categoryId,
      },
      {
        $set: {
          "favorites.$.creditCardId": null,
        },
      },
      { new: true }
    );

    return res.status(200).json(user.favorites);
  } catch (error) {
    console.log(error);
  }
});

router.delete("/:userId/card/:creditCardId", async (req, res) => {
  const { userId, creditCardId } = req.params;

  if (!userId || !creditCardId) {
    return res.status(400).json({ message: "no user or credit card found" });
  }

  const result = await User.findOneAndUpdate(
    {
      googleId: userId,
    },
    {
      $pull: {
        wallet: {
          creditCardId: creditCardId,
        },
      },
    }
  );
  if (result) {
    return res.status(200).json({ message: "successflly delted" });
  }
});

router.put(`/:userId/favorites`, async (req, res) => {
  const { userId } = req.params;
  const { creditCardId, categoryName, categoryId } = req.body;
  if (!userId || !creditCardId || !categoryName || !categoryId) {
    return res.status(400).json({ message: "no user or card or category" });
  }
  try {
    const user = await User.findOneAndUpdate(
      {
        googleId: userId,
      },

      {
        $set: {
          "favorites.$[elem].creditCardId": creditCardId,
          "favorites.$[elem].categoryName": categoryName,
        },
      },
      {
        arrayFilters: [{ "elem.categoryId": categoryId }],
        new: true,
      }
    )
      .populate("favorites.creditCardId")
      .exec();

    return res.status(200).json(user.favorites);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
