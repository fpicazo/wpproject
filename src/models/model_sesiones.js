const mongoose = require("mongoose");

const sesionesSchema = new mongoose.Schema({
  active_session: {
    required: true,
    type: Boolean,
  },
  number: {
    required: false,
    type: String,
  },
  authenticated: {
    required: false,
    type: Boolean,
  },
  company: {
    required: true,
    type: String,
  },
  qrcode: {
    required: false,
    type: String,
  },
});

module.exports = mongoose.model("sesionesSchema", sesionesSchema);
