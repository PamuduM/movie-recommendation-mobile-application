const { Favorite, Movie } = require('../models');

exports.getFavoritesByUser = async (req, res) => {
  try {
    const requestedUserId = Number(req.params.userId);
    if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }
    if (requestedUserId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own favorites' });
    }

    const favorites = await Favorite.findAll({
      where: { userId: requestedUserId },
      include: [{ model: Movie, attributes: ['id', 'title', 'poster', 'description'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

exports.addToFavorites = async (req, res) => {
  try {
    const { movieId } = req.body;
    
    if (!movieId || !Number.isInteger(Number(movieId)) || Number(movieId) <= 0) {
      return res.status(400).json({ error: 'Valid movie ID is required' });
    }

    const [entry, created] = await Favorite.findOrCreate({
      where: { userId: req.user.id, movieId },
      defaults: { userId: req.user.id, movieId }
    });

    const statusCode = created ? 201 : 200;
    const message = created ? 'Added to favorites' : 'Already in favorites';
    res.status(statusCode).json({ ...entry.toJSON(), message });
  } catch (err) {
    console.error('Error adding to favorites:', err);
    res.status(400).json({ error: 'Failed to add to favorites' });
  }
};

exports.removeFromFavorites = async (req, res) => {
  try {
    const entry = await Favorite.findByPk(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Favorite entry not found' });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only remove your own favorites' });
    }
    await entry.destroy();
    res.json({ message: 'Successfully removed from favorites' });
  } catch (err) {
    console.error('Error removing from favorites:', err);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
};
