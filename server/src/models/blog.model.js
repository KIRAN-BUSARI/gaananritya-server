import mongoose, { Schema } from 'mongoose';

const blogSchema = new Schema({
  title: {
    type: String,
    required: true,
    index: true // Add index for text search
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
    index: true // Add index for author searches
  },
  date: {
    type: Date,
    default: Date.now,
    index: true // Add index for date sorting
  },
  image: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: ['Classical Dance', 'Bharatanatyam'],
    index: true // Add index for tag filtering
  },
}, {
  timestamps: true,
});

// Add compound index for search queries
blogSchema.index(
  {
    title: 'text',
    content: 'text',
    author: 'text'
  },
  {
    name: 'blog_text_index',
    weights: {
      title: 10,
      content: 5,
      author: 3
    }
  }
);

export const Blog = mongoose.model('Blog', blogSchema);