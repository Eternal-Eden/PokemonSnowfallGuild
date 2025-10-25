import { Router } from 'express';
import {
  getStaticDataTypes,
  getStaticData,
  getTypes,
  getNatures,
  getMoves,
  searchMoves,
  getItems,
  searchItems,
  getDataStats,
  getCustomItems
} from '../controllers/staticDataController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 所有路由都是公开的
router.get('/', asyncHandler(getStaticDataTypes));
router.get('/stats', asyncHandler(getDataStats));
router.get('/types', asyncHandler(getTypes));
router.get('/natures', asyncHandler(getNatures));
router.get('/moves', asyncHandler(getMoves));
router.get('/moves/search', asyncHandler(searchMoves));
router.get('/items', asyncHandler(getItems));
router.get('/items/search', asyncHandler(searchItems));
router.get('/items/custom', asyncHandler(getCustomItems));
router.get('/:type', asyncHandler(getStaticData));

export default router;