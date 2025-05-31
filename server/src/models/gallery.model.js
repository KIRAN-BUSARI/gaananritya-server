import mongoose, { Schema } from "mongoose";

const gallerySchema = new Schema({
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true // Add index for category searches
  },
}, {
  timestamps: true
});

// Add compound index for timestamp-based filtering by category
gallerySchema.index({ category: 1, createdAt: -1 });

export const Gallery = mongoose.model("Gallery", gallerySchema);