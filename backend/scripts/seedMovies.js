#!/usr/bin/env node
/*
 * Seeds the SQLite development database with curated movies
 * and review ratings for the AI mood recommender.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sequelize = require('../src/config/database');
require('../src/models');
const { Movie, Review, User } = require('../src/models');

const MOVIE_SEED = [
  {
    title: 'Sunshine Avenue',
    description: 'A vibrant comedy about neighbors who start a community music night.',
    releaseDate: '2021-06-18',
    poster: 'https://image.tmdb.org/t/p/w500/sunshine-avenue.jpg',
    genres: ['Comedy', 'Family', 'Music'],
  },
  {
    title: 'Neon Pulse',
    description: 'Cyberpunk action thriller packed with stylish fights.',
    releaseDate: '2022-02-11',
    poster: 'https://image.tmdb.org/t/p/w500/neon-pulse.jpg',
    genres: ['Action', 'Sci-Fi'],
  },
  {
    title: 'Letters to Lila',
    description: 'A heartfelt romance told through exchanged letters.',
    releaseDate: '2020-09-10',
    poster: 'https://image.tmdb.org/t/p/w500/letters-lila.jpg',
    genres: ['Romance', 'Drama'],
  },
  {
    title: 'Moonlit Harbor',
    description: 'A calm story about healing and hope by the sea.',
    releaseDate: '2019-04-21',
    poster: 'https://image.tmdb.org/t/p/w500/moonlit-harbor.jpg',
    genres: ['Drama'],
  },
  {
    title: 'Skyline Rush',
    description: 'Urban parkour action across a futuristic skyline.',
    releaseDate: '2023-01-15',
    poster: 'https://image.tmdb.org/t/p/w500/skyline-rush.jpg',
    genres: ['Action', 'Adventure'],
  },
  {
    title: 'Orbiting Hearts',
    description: 'A poetic long-distance romance set in space.',
    releaseDate: '2021-12-03',
    poster: 'https://image.tmdb.org/t/p/w500/orbiting-hearts.jpg',
    genres: ['Romance', 'Sci-Fi'],
  },
  {
    title: 'Hurricane Alley',
    description: 'A tense disaster survival thriller.',
    releaseDate: '2018-08-09',
    poster: 'https://image.tmdb.org/t/p/w500/hurricane-alley.jpg',
    genres: ['Thriller'],
  },
  {
    title: 'Emberfall',
    description: 'Dark fantasy noir in a magical dying city.',
    releaseDate: '2022-10-28',
    poster: 'https://image.tmdb.org/t/p/w500/emberfall.jpg',
    genres: ['Fantasy', 'Mystery'],
  },
];

const REVIEW_SEED = [
  { title: 'Sunshine Avenue', reviews: [{ userId: 1, rating: 4.6 }, { userId: 2, rating: 4.2 }] },
  { title: 'Neon Pulse', reviews: [{ userId: 1, rating: 4.8 }, { userId: 3, rating: 4.4 }] },
  { title: 'Letters to Lila', reviews: [{ userId: 2, rating: 4.9 }, { userId: 3, rating: 4.5 }] },
  { title: 'Moonlit Harbor', reviews: [{ userId: 1, rating: 4.3 }, { userId: 2, rating: 4.1 }] },
  { title: 'Skyline Rush', reviews: [{ userId: 1, rating: 4.2 }, { userId: 3, rating: 4.0 }] },
  { title: 'Orbiting Hearts', reviews: [{ userId: 2, rating: 4.7 }, { userId: 1, rating: 4.4 }] },
  { title: 'Hurricane Alley', reviews: [{ userId: 3, rating: 4.3 }] },
  { title: 'Emberfall', reviews: [{ userId: 1, rating: 4.0 }, { userId: 2, rating: 4.2 }] },
];

async function seedMovies({ dryRun = false } = {}) {
  console.log('🌱 Starting database seed...');

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const transaction = await sequelize.transaction();
  try {
    const userCount = await User.count();
    if (!userCount) throw new Error('Create users before running seed.');

    await Promise.all(
      MOVIE_SEED.map((movie) =>
        Movie.upsert(
          {
            ...movie,
            genres: JSON.stringify(movie.genres),
          },
          { transaction }
        )
      )
    );

    console.log('🎬 Movies seeded');

    for (const bucket of REVIEW_SEED) {
      const movie = await Movie.findOne({
        where: { title: bucket.title },
        transaction,
      });

      if (!movie) continue;

      await Promise.all(
        bucket.reviews.map((review) =>
          Review.upsert(
            { userId: review.userId, movieId: movie.id, rating: review.rating },
            { transaction }
          )
        )
      );
    }

    console.log('⭐ Reviews seeded');

    if (!dryRun) await transaction.commit();
    else await transaction.rollback();

    const movies = await Movie.count();
    const reviews = await Review.count();
    console.log(`✅ Seed finished | Movies: ${movies} | Reviews: ${reviews}`);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

seedMovies();