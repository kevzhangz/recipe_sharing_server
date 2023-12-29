import express from 'express'
import authController from '../controllers/auth.controller'
import recipeController from '../controllers/recipe.controller';

const router = express.Router();

router.route('/api/recipe')
     .get(authController.checkSignin, recipeController.findAll)
     .post(authController.checkSignin, recipeController.create)

router.route('/api/recipe/user')
     .get(authController.checkSignin, recipeController.recipeByUser)

router.route('/api/recipe/:recipe_id')
     .get(authController.checkSignin, recipeController.read)
     .put(authController.checkSignin, recipeController.update)
     .delete(authController.checkSignin, recipeController.destroy)

router.route('/api/recipe/:recipe_id/rate')
     .post(authController.checkSignin, recipeController.rateRecipe)

router.route('/api/recipe/:recipe_id/save')
     .post(authController.checkSignin, recipeController.saveRecipe)

router.param('recipe_id', recipeController.recipeById);

export default router