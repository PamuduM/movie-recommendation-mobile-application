const { Watchlist, Movie } = require('../models');

const normalizeGenres = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'number' ? String(item) : String(item || '').trim()))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const buildMoviePayload = (movieId, movieData = {}) => {
  const releaseDate = movieData.releaseDate ?? movieData.release_date ?? null;
  const poster = movieData.poster ?? movieData.poster_path ?? null;
  const description = movieData.description ?? movieData.overview ?? null;
  const genres = normalizeGenres(movieData.genres ?? movieData.genre_ids);
  const title = movieData.title ?? movieData.name ?? `Movie #${movieId}`;
  return {
    id: movieId,
    title,
    description,
    releaseDate,
    poster,
    genres,
  };
};

const loadWatchlistByUserId = async (userId) => {
  return Watchlist.findAll({
    where: { userId },
    include: [Movie],
  });
};

exports.getMyWatchlist = async (req, res) => {
  try {
    const watchlist = await loadWatchlistByUserId(req.user.id);
    res.json(watchlist);
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

exports.getWatchlistByUser = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (requestedUserId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own watchlist' });
    }

    const watchlist = await loadWatchlistByUserId(requestedUserId);
    res.json(watchlist);
  } catch (err) {
    console.error('Error fetching user watchlist:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
};

exports.addToWatchlist = async (req, res) => {
  try {
    const numericMovieId = Number(req.body.movieId);
    if (!Number.isInteger(numericMovieId) || numericMovieId <= 0) {
      return res.status(400).json({ error: 'Valid movie ID is required' });
    }

    const [movie] = await Movie.findOrCreate({
      where: { id: numericMovieId },
      defaults: buildMoviePayload(numericMovieId, req.body.movie || {}),
    });

    const [entry, created] = await Watchlist.findOrCreate({
      where: { userId: req.user.id, movieId: numericMovieId },
      defaults: { userId: req.user.id, movieId: numericMovieId },
    });

    await entry.reload({ include: [Movie] });
    const statusCode = created ? 201 : 200;
    const message = created ? 'Added to watchlist' : 'Already in watchlist';
    res.status(statusCode).json({ ...entry.toJSON(), message });
  } catch (err) {
    console.error('Error adding to watchlist:', err);
    res.status(400).json({ error: 'Failed to add to watchlist' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const entry = await Watchlist.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only remove your own entries' });
    }
    await entry.destroy();
    res.json({ message: 'Successfully removed from watchlist' });
  } catch (err) {
    console.error('Error removing from watchlist:', err);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};
