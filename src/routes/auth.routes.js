import express from 'express'
import authCtrl from '../controllers/auth.controller.js'

const router = express.Router()

router.route('/api/signin')
      .post(authCtrl.signin)


router.route('/api/signout')
      .get(authCtrl.signout)

export default router;