const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  fileKey: { type: String, required: true },
  templateName: { type: String, required: true },
  data: { type: Object, required: true }, // Figma JSON data
}, { timestamps: true });

module.exports = mongoose.model('Template', TemplateSchema);
