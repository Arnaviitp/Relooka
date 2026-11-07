const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reviewerRole: {
      type: String,
      enum: ['renter', 'lender'],
      required: true
    },
    // Renter rating dimensions (1-5)
    itemAccuracy: { type: Number, min: 1, max: 5 },
    itemCondition: { type: Number, min: 1, max: 5 },
    lenderConduct: { type: Number, min: 1, max: 5 },

    // Lender rating dimensions (1-5)
    returnCondition: { type: Number, min: 1, max: 5 },
    renterConduct: { type: Number, min: 1, max: 5 },

    // Computed composite average for this review
    averageScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

// Ensure one feedback per reviewer per order
feedbackSchema.index({ orderId: 1, reviewerId: 1 }, { unique: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
