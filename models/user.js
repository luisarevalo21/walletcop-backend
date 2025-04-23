const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    userId: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    wallet: [
      {
        creditCardId: { type: Schema.Types.ObjectId, ref: "Card" },
        addedAt: { type: Date, default: Date.now }, // Timestamp when the card was added
        categoryId: { type: Schema.Types.ObjectId, ref: "Category" }, // Associated category
      },
    ],
    favorites: {
      type: [
        {
          categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null, required: true },
          categoryName: {
            type: String,
            ref: "Category",
            required: true,
            validate: {
              validator: async function (value) {
                const categoryExists = await mongoose.model("Category").exists({ category: value });
                return categoryExists;
              },
              message: props => `${props.value} is not a valid category!`,
            },
          },
          creditCardId: { type: Schema.Types.ObjectId, ref: "Card", default: null },
        },
      ],
    },
    categories: [
      {
        categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
      },
    ],
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

// default: [
//   { cardId: null, categoryName: "Gas" },
//   { cardId: null, categoryName: "Dining" },
//   { cardId: null, categoryName: "Groceries" },
// ],
