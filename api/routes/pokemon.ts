import { Router } from 'express';
import {
  getPokemon,
  getPokemonById,
  searchPokemon,
  getPokemonTypeStats
} from '../controllers/pokemonController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// 所有路由都是公开的
router.get('/', asyncHandler(getPokemon));
router.get('/search', asyncHandler(searchPokemon));
router.get('/stats/types', asyncHandler(getPokemonTypeStats));
router.get('/:id', asyncHandler(getPokemonById));

export default router;