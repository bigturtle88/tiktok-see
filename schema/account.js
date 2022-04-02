const Mongoose = require('mongoose');

const accountSchema = new Mongoose.Schema({
  _id: Mongoose.Schema.Types.ObjectId,
  email: {
    type: String,
    unique: true,
  },
  proxy: {
    type: Object,
  },
  status: {
    type: Number,
  },
  count: {
    type: Number,
  },
  patternName: {
    type: Object,
  },
  date: Date,
});
module.exports = Mongoose.model('Account', accountSchema);
