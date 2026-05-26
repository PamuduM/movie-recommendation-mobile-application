const { Review, Movie, User } = require('../models');

exports.getReviewsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    if (!movieId || isNaN(movieId)) {
      return res.status(400).json({ error: 'Valid movie ID is required' });
    }

    const reviews = await Review.findAll({
      where: { movieId },
      include: [{ model: User, attributes: ['id', 'username', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const reviews = await Review.findAll({
      where: { userId },
      include: [{ model: Movie, attributes: ['id', 'title', 'poster'] }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { movieId, rating, comment } = req.body;
    
    if (!movieId || !rating) {
      return res.status(400).json({ error: 'Movie ID and rating are required' });
    }
    
    if (rating < 0 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 0 and 10' });
    }

    const review = await Review.create({
      movieId,
      rating,
      comment: comment?.trim() || null,
      userId: req.user.id
    });
    
    res.status(201).json(review);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(400).json({ error: 'Failed to create review' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own reviews' });
    }
    
    const { rating, comment } = req.body;
    if (rating !== undefined) {
      if (rating < 0 || rating > 10) {
        return res.status(400).json({ error: 'Rating must be between 0 and 10' });
      }
      review.rating = rating;
    }
    if (comment !== undefined) {
      review.comment = comment?.trim() || null;
    }

    await review.save();
    res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(400).json({ error: 'Failed to update review' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own reviews' });
    }

    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
