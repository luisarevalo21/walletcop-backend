const mongoose = require("mongoose");
//defines the strucutre of the document
//model wraps around the schema
//constructor function
//model will be absed on the schema
//schema is the blueprint
//model is the actual object
//which allwos us to communicate with the database
const Schema = mongoose.Schema;

const cardSchema = new Schema(
  {
    creditCardName: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
      required: true,
    },
    fees: {
      annualFee: { type: String },
      foreignTransactionFee: { type: String },
      balanceTransferFee: { type: String },
    },
    bankName: {
      type: String,
      required: true,
    },
    cardImage: {
      type: String,
    },
    bonuses: [
      {
        type: { type: String, enum: ["cashback", "points", "miles"], required: true },
        value: { type: Number, required: true },
        unit: { type: String, enum: ["%", "points per $", "miles per $"], required: true },
        categories: [String],
        details: String,
      },
    ],
    benefits: [String], // General benefits,
    imageUrl: {
      type: String,
    },
    category: [String],
  },
  {
    timestamps: true,
  }
);

const Card = mongoose.model("Card", cardSchema);
module.exports = Card;
