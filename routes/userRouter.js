const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/:userId/newcard", async (req, res) => {
  try {
    const { userId } = req.params;
    const { creditCardId } = req.body;
    const user = await User.findOne({
      userId: userId,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      userId: userId,
    });

    //check if previous card isn' the same the current one being changed
    //if different remove the categoryId from previous and add it to the new one
    //will need to change the favorites array as well with the new changes
    //proably the issue that is occuring
    const favoriteCard = user.favorites.find(fav => fav.categoryId.equals(categoryId));
    console.log("favorite", favoriteCard);
    if (favoriteCard) {
      const foundCard = user.wallet.find(card => card.creditCardId.equals(cardId));
      if (foundCard) {
        foundCard.categoryId = categoryId;
      }
      favoriteCard.creditCardId = cardId;
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

//updates the users favorites and the card inside their wallet
router.put("/:userId/favorites", async (req, res) => {
  const { userId } = req.params;
  const { cardId, categoryName, categoryId, usersCards } = req.body;

  if (!userId || !cardId || !categoryName) {
    return res.status(400).json({ message: "no user or card or category" });
  }
  try {
    const user = await User.findOne({
      userId: userId,
    }).populate("wallet.creditCardId");

    const favoriteCategory = user.favorites.find(fav => fav.categoryId.equals(categoryId));
    if (favoriteCategory) {
      favoriteCategory.creditCardId = cardId;
    } else if (!favoriteCategory) {
      user.favorites.push({
        categoryId: categoryId,
        creditCardId: cardId,
        categoryName,
      });
    }

    let updatedFavoriteCard = null;
    user.wallet.forEach(card => {
      if (card?.categoryId && card?.categoryId.equals(categoryId)) {
        card.categoryId = null; // Set to null instead of deleting for better consistency
      }
      if (card?.creditCardId.equals(cardId)) {
        card.categoryId = categoryId;
        updatedFavoriteCard = card;
      }
    });

    await user.save();

    return res.status(200).json({ message: "okay" });
  } catch (err) {
    console.log("error", err);
    return res.status(400).send(err);
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
      { userId: userId },
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
    const updated = await User.findOneAndUpdate({ userId: userId }, { $pull: { favorites: { categoryId: categoryId } } }, { new: true })
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

  if (!userId) return [];
  try {
    const usersCards = await User.findOne({ userId: userId })
      .populate("wallet.creditCardId") // Populate card details
      .exec();

    if (usersCards.wallet.length === 0) {
      return res.status(200).json([]);
    }
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
      userId: userId,
    })
      .populate("wallet.creditCardId")
      .populate("wallet.categoryId")
      .exec();
    if (!usersWallet) return res.status(400).json([]);

    //get and populate the uesrs cards.
    //filtered based on the given category id, if the cards in the uers wallet doesn't provide cashback for that caterogy filter it out
    //next order from ascending of hihgest cashback for the given cateogry
    //return the data

    const filteredCards = usersWallet.wallet.filter(cardWrapper => {
      const card = cardWrapper.creditCardId;
      if (card.category.includes(category)) {
        return cardWrapper;
      }
      return;
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
        categoryId: cardWrapper.categoryId,
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
      userId: userId,
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
        userId: userId,
        "favorites.categoryId": categoryId,
      },
      {
        $set: {
          "favorites.$.creditCardId": null,
        },
      },
      { new: true }
    )
      .populate("favorites.creditCardId")
      .exec();

    // console.log("users favorites", user.favorites);
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
      userId: userId,
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
        userId: userId,
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

    // console.log("user", user);
    return res.status(200).json(user.favorites);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
