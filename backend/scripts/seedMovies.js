#!/usr/bin/env node
/*
 * Seeds the SQLite development database with curated movies and review ratings
 * to power the AI mood recommender locally.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sequelize = require('../src/config/database');
require('../src/models');
const { Movie, Review, User } = require('../src/models');

const MOVIE_SEED = [
  {
    title: 'Sunshine Avenue',
    description: 'A vibrant comedy about neighbors who start a community music night to shake off the weekday blues.',
    releaseDate: '2021-06-18',
    poster: 'https://image.tmdb.org/t/p/w500/sunshine-avenue.jpg',
    genres: ['Comedy', 'Family', 'Music'],
  },
];

const REVIEW_SEED = [
  {
    title: 'Sunshine Avenue',
    reviews: [
      { userId: 1, rating: 4.6, comment: 'Instant smile material.' },
      { userId: 2, rating: 4.2, comment: 'Perfect comfort film.' },
    ],
  },
  {
    title: 'Neon Pulse',
    reviews: [
      { userId: 1, rating: 4.8, comment: 'Adrenaline shot straight to the heart.' },
      { userId: 3, rating: 4.4, comment: 'Stylish fights and great pacing.' },
    ],
  },
  {
    title: 'Letters to Lila',
    reviews: [
      { userId: 2, rating: 4.9, comment: 'Romance done right.' },
      { userId: 3, rating: 4.5, comment: 'Soft, sincere, lovely.' },
    ],
  },
  {
    title: 'Moonlit Harbor',
    reviews: [
      { userId: 1, rating: 4.3, comment: 'Calm and hopeful.' },
      { userId: 2, rating: 4.1, comment: 'Slow, but in the best way.' },
    ],
  },
  {
    title: 'Skyline Rush',
    reviews: [
      { userId: 1, rating: 4.2, comment: 'Wild parkour finale.' },
      { userId: 3, rating: 4.0, comment: 'Soundtrack slaps.' },
    ],
  },
  {
    title: 'Orbiting Hearts',
    reviews: [
      { userId: 2, rating: 4.7, comment: 'Space long-distance romance hits hard.' },
      { userId: 1, rating: 4.4, comment: 'Poetic and nerdy.' },
    ],
  },
  {
    title: 'Hurricane Alley',
    reviews: [
      { userId: 3, rating: 4.3, comment: 'Tense disaster thrills.' },
    ],
  },
  {
    title: 'Emberfall',
    reviews: [
      { userId: 1, rating: 4.0, comment: 'Moody, magical noir.' },
      { userId: 2, rating: 4.2, comment: 'Loved the worldbuilding.' },
    ],
  },
];

async function seedMovies() {
  await sequelize.authenticate();
  await sequelize.sync();

  const existingUsers = await User.count();
  if (!existingUsers) {
    throw new Error('No users found. Please create at least one user before seeding reviews.');
  }

  const createdMovies = [];
  for (const payload of MOVIE_SEED) {
    const [movie, created] = await Movie.findOrCreate({
      where: { title: payload.title },
      defaults: payload,
    });
    if (!created) {
      await movie.update(payload);
    }
    createdMovies.push(movie);
  }

  for (const bucket of REVIEW_SEED) {
    const movie = createdMovies.find((m) => m.title === bucket.title) || (await Movie.findOne({ where: { title: bucket.title } }));
    if (!movie) continue;
    for (const entry of bucket.reviews) {
      const existing = await Review.findOne({ where: { userId: entry.userId, movieId: movie.id } });
      if (existing) {
        await existing.update({ rating: entry.rating, comment: entry.comment });
      } else {
        await Review.create({
          userId: entry.userId,
          movieId: movie.id,
          rating: entry.rating,
          comment: entry.comment,
        });
      }
    }
  }

  const movieCount = await Movie.count();
  const reviewCount = await Review.count();
  console.log(`Seed complete. Movies: ${movieCount}, Reviews: ${reviewCount}`);
}

seedMovies()
  .then(() => {
    return sequelize.close();
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    sequelize.close().finally(() => process.exit(1));
  });
