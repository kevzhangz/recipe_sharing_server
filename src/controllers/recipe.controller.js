import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import Recipe from '../models/recipe.model.js'
import User from '../models/user.model.js'
import Category from '../models/category.model.js'
import extend from 'lodash/extend.js'

const recipeProjections = {
  '__v': false
}

const findAll = async (req, res) => {
  try {
    const limit = req.query.limit != null ? req.query.limit : 0;

    let result = (await Recipe.find({}, recipeProjections).populate('category posted_by', 'name').sort({ _id: -1}).limit(limit));

    result = modifyResult(result);
    result = await addStatus(req.auth._id, result);

    return res.status(200).json({result})
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const create = async (req, res) => {
  try {
    let buffer = Buffer.from(req.body.image, 'base64')

    let newRecipe = {
      ...req.body,
      recipe_id: generator.generateId(8),
      posted_by: req.auth,
      image: {
        data: buffer,
        contentType: 'img/jpeg'
      },
      rating: []
    }

    const categories = req.body.category.split(',');

    const categoryIds = await Promise.all(categories.map(async categoryName => {
      // Check if the category already exists
      let category = await Category.findOne({ name: categoryName });
    
      // If the category doesn't exist, create it
      if (!category) {
        category = await Category.create({ name: categoryName });
      }
    
      return category._id;
    }));

    newRecipe.category = categoryIds;

    const recipe = new Recipe(newRecipe)
    await recipe.save()

    return res.status(200).json({
      messages: 'Recipe successfully posted',
    })

  } catch (err){
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const read = async (req, res) => {
  try {
    let recipe = modifyResult([req.recipe]);

    return res.status(200).json(recipe[0])
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let recipe = req.recipe

    if(req.body.image){
      let buffer = Buffer.from(req.body.image, 'base64')
      req.body.image = {};
      req.body.image.data = buffer;
      req.body.image.contentType = 'img/jpeg';
    }

    recipe = extend(recipe, req.body)
    await recipe.save();

    return res.status(200).json({
      messages : 'Recipe Successfully updated'
    });
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const destroy = async (req, res) => {
  try {
    const recipe = req.recipe;

    await recipe.deleteOne();

    return res.status(200).json({
      messages: 'Recipe Successfully deleted'
  })
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const recipeById = async (req, res, next, id) => {
  try {
    const recipe = await Recipe.findOne({recipe_id: id}).populate('category posted_by', 'name -_id');

    if(!recipe){
      throw Error("Recipe not found");
    }

    req.recipe = recipe
    next()
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

// Return recipe created by user and saved by user
const recipeByUser = async (req, res) => {
  try {
    let userCreatedRecipe = await Recipe.find({posted_by: req.auth._id}, recipeProjections).sort({ _id: -1}).populate('category posted_by', 'name');
    let userSavedRecipe = await User.findOne({_id: req.auth._id}).populate({
      path: 'saved_recipe',
      populate: {path: 'category posted_by', select: 'name'}
    });

    let saved = modifyResult(userSavedRecipe.saved_recipe);
    saved = await addStatus(req.auth._id, saved);

    let created = modifyResult(userCreatedRecipe);
    created = await addStatus(req.auth._id, created);

    let recipe = {
      saved,
      created
    };

    return res.status(200).json(recipe);
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

// Rate recipe, if user already rate the recipe, update the rating
const rateRecipe = async (req, res) => {
  try {
    const userId = req.auth._id;
    let recipe = req.recipe;

    const existRatingIndex = recipe.rating.findIndex(userRating => userRating.user.toString() === userId);

    if(existRatingIndex != -1){
      recipe.rating[existRatingIndex].rating = req.body.rating;
    } else {
      recipe.rating.push({user: userId, rating: req.body.rating});
    }

    const totalRatings = recipe.rating.length;
    const totalRatingSum = recipe.rating.reduce((sum, userRating) => sum + userRating.rating, 0);
    const newAverageRating = totalRatings > 0 ? totalRatingSum / totalRatings : 0;

    await recipe.save();

    return res.status(200).json({
      messages: 'Recipe successfully rated',
      rating: newAverageRating
    });

  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

// Save and unsave recipe
const saveRecipe = async (req, res) => {
  try {
    const userId = req.auth._id;
    let action;

    let user = await User.findById(userId);
    let recipe = req.recipe;

    // Check if the recipe is already saved
    const recipeIndex = user.saved_recipe.indexOf(recipe._id);


    if (recipeIndex !== -1) {
      // Recipe is already saved, so unsave it
      user.saved_recipe.splice(recipeIndex, 1);
      action = 'unsaved';
    } else {
      // Recipe is not saved, so save it
      user.saved_recipe.push(recipe._id);
      action = 'saved';
    }

    await user.save();
    return res.status(200).json({ message: `Recipe ${action} successfully` });
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

// add isSaved and isCreated property to let client know if user has saved or created the recipe
const addStatus = async (userId, recipes) => {
  const user = await User.findById(userId);

  // Create a Set of saved recipe IDs for efficient lookup
  const savedRecipeIds = new Set(user.saved_recipe.map(savedRecipe => savedRecipe._id.toString()));
  const createdRecipeIds = new Set(recipes.filter(recipe => {
    return recipe.posted_by._id.equals(userId);
  }).map(recipe => {
    return recipe._id.toString()
  }));

  let recipesWithSaveStatus = recipes.map(recipe => ({
    ...recipe,
    posted_by: {name: recipe.posted_by.name},
    isSaved: savedRecipeIds.has(recipe._id.toString()),
    isCreated: createdRecipeIds.has(recipe._id.toString()),
  }));

  return recipesWithSaveStatus;
}

// Modify recipe data to make it easier to use on client side
const modifyResult = (recipe) => {
  let res = recipe.map(item => {
    let base64Image = item.image.data.toString('base64');
    var averageRating = 0;

    if(item.rating.length > 0){
      let totalRating = item.rating.reduce((sum, rating) => sum + rating.rating, 0);
      averageRating = totalRating / item.rating.length;
    }

    let category = [];
    if(item.category != null && item.category.length > 0){
      category = item.category.map(i => i.name);
    }

    // let rest;
    // if(recipe.length > 1){
    //   // Exclude descriptions, ingredients, instructions, posted_by attribute
    //   ({ descriptions, ingredients, instructions, posted_by, ...rest } = item._doc);
    // } else {
    //   ({...rest} = item._doc);
    // }

    return {
      ...item._doc,
      rating: averageRating,
      image: base64Image,
      category
    }
  });

  return res;
}

export default {
  findAll,
  create,
  read,
  update,
  destroy,
  recipeById,
  recipeByUser,
  rateRecipe,
  saveRecipe,
}