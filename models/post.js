const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['both'],
    default: 'both',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Text content is required.']
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio file is required.']
  },
  mood: {
    type: String,
    required: [true, 'Mood is required.']
  },
  region: {
    type: String,
    required: [true, 'Region is required.']
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags) {
        return tags.every(tag => /^#[a-zA-Z0-9_]+$/.test(tag));
      },
      message: 'Each tag must start with # and contain only letters, numbers, or underscores.'
    }
  },
  views: {
    type: Number,
    default: 0
  },
  reactions: {
    relatable: { type: Number, default: 0 },
    shocking: { type: Number, default: 0 },
    funny: { type: Number, default: 0 },
    sad: { type: Number, default: 0 }
  }
}, { timestamps: true }); // ✅ enable createdAt and updatedAt

module.exports = mongoose.model('Post', postSchema);







