import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
  getFavoriteTemplates
} from '../controllers/templateController';

const router = Router();

// 公开路由
router.get('/', asyncHandler(getTemplates));
router.get('/:id', asyncHandler(getTemplate));

// 需要认证的路由
router.post('/', authenticateToken, asyncHandler(createTemplate));
router.put('/:id', authenticateToken, asyncHandler(updateTemplate));
router.delete('/:id', authenticateToken, asyncHandler(deleteTemplate));
router.post('/:id/favorite', authenticateToken, asyncHandler(toggleFavorite));
router.get('/favorites/list', authenticateToken, asyncHandler(getFavoriteTemplates));

export default router;