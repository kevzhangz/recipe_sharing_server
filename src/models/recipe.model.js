import mongoose from 'mongoose'

const RecipeSchema = new mongoose.Schema({
  recipe_id: String,
  title: { type: String, required: true },
  descriptions: { type: String, required: true },
  ingredients: { type: String, required: true },
  instructions: { type: String, required: true },
  posted_by: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  rating: [
    {
      _id: false,
      user: { type: mongoose.Schema.ObjectId, ref: 'User' },
      rating: { type: Number, required: true },
    },
  ],
  category: [{ type: mongoose.Schema.ObjectId, ref: 'Category'}],
  image: { data: Buffer, contentType: String},
});

export default mongoose.model('Recipe', RecipeSchema);