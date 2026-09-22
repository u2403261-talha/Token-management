// Token model representing a queue token requested by a user
const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    // Reference to the associated Event document
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Sequential token number (e.g. 1, 2, 3...)
    tokenNumber: {
      type: Number,
      required: true,
    },
    // Name of person requesting the token
    name: {
      type: String,
      required: true,
    },
    // Status of token: "waiting", "serving", "completed", "done"
    status: {
      type: String,
      default: "waiting",
    },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model("Token", tokenSchema);
