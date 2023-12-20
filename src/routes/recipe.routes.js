import express from 'express'
import authController from '../controllers/auth.controller'
import recipeController from '../controllers/recipe.controller';

const router = express.Router();

router.route('/api/recipe')
     .get(recipeController.findAll)
     .post(authController.checkSignin, recipeController.create)

router.route('/api/recipe/user')
     .get(authController.checkSignin, recipeController.recipeByUser)

router.route('/api/recipe/:recipe_id')
     .get(authController.checkSignin, recipeController.read)

router.param('recipe_id', recipeController.recipeById);

export default router