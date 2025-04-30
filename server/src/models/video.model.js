import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema({
  videoUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: "Untitled Video"
  },
  thumbnailUrl: {
    type: String
  },
  category: {
    type: String,
    default: "videos",
    required: true
  },
}, {
  timestamps: true
});

export const Video = mongoose.model("Video", videoSchema);