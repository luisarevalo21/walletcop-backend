const mongoose = require("mongoose");
const Card = require("./cards");
const Schema = mongoose.Schema;

const bankSchema = new Schema(
  {
    bankName: {
      type: String,
      required: true,
    },
    abbreviation: {
      type: String,
      required: true,
    },
    // creditCards: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: "Card",
    //   },
    // ],
  },
  { timestamps: true }
);

const Bank = mongoose.model("Bank", bankSchema);
module.exports = Bank;
