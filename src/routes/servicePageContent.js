import { Router } from 'express'
import * as servicePageContentController from '../controllers/servicePageContent.controller.js'

const router = Router()

router.get('/:pageKey', servicePageContentController.getPublic)

export default router
