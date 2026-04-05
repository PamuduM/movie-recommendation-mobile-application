#!/usr/bin/env node
/*
 * Seeds the SQLite development database with curated movies
 * and review ratings for the AI mood recommender.
 */

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const sequelize = require('../src/config/database');
require('../src/models');

const { Movie, Review, User } = require('../src/models');

/* -------------------------------------------------------------------------- */
/*                                MOVIE DATA                                  */
/* -------------------------------------------------------------------------- */

const MOVIE_SEED = [
  {
    title: 'Sunshine Avenue',
    description:
      'A vibrant comedy about neighbors who start a community music night.',
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
    description: 'A slow and calming story about healing and hope.',
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
    genres: ['Thriller', 'Disaster'],
  },
  {
    title: 'Emberfall',
    description: 'Dark fantasy noir in a magical dying city.',
    releaseDate: '2022-10-28',
    poster: 'https://image.tmdb.org/t/p/w500/emberfall.jpg',
    genres: ['Fantasy', 'Mystery'],
  },
];

/* -------------------------------------------------------------------------- */
/*                                REVIEW DATA                                 */
/* -------------------------------------------------------------------------- */

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
      { userId: 2, rating: 4.1, comment: 'Slow, but beautiful.' },
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
      { userId: 2, rating: 4.7, comment: 'Space romance hits hard.' },
      { userId: 1, rating: 4.4, comment: 'Poetic and nerdy.' },
    ],
  },
  {
    title: 'Hurricane Alley',
    reviews: [{ userId: 3, rating: 4.3, comment: 'Tense disaster thrills.' }],
  },
  {
    title: 'Emberfall',
    reviews: [
      { userId: 1, rating: 4.0, comment: 'Moody magical noir.' },
      { userId: 2, rating: 4.2, comment: 'Loved the worldbuilding.' },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*                               SEED FUNCTION                                */
/* -------------------------------------------------------------------------- */

async function seedMovies() {
  console.log('🌱 Starting database seed...');

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const transaction = await sequelize.transaction();

  try {
    /* --------------------------- Validate Users --------------------------- */

    const users = await User.findAll({
      where: { id: [1, 2, 3] },
      transaction,
    });

    if (users.length === 0) {
      throw new Error(
        'No users found. Create users before running seed script.'
      );
    }

    /* ---------------------------- Seed Movies ----------------------------- */

    const movieMap = {};

    for (const payload of MOVIE_SEED) {
      const [movie] = await Movie.upsert(payload, {
        returning: true,
        transaction,
      });

      movieMap[payload.title] = movie;
      console.log(`🎬 Seeded movie: ${payload.title}`);
    }

    /* ---------------------------- Seed Reviews ---------------------------- */

    for (const bucket of REVIEW_SEED) {
      const movie = movieMap[bucket.title];

      if (!movie) {
        console.warn(`⚠ Movie not found: ${bucket.title}`);
        continue;
      }

      await Promise.all(
        bucket.reviews.map((entry) =>
          Review.upsert(
            {
              userId: entry.userId,
              movieId: movie.id,
              rating: entry.rating,
              comment: entry.comment,
            },
            { transaction }
          )
        )
      );

      console.log(`⭐ Reviews added for: ${bucket.title}`);
    }

    await transaction.commit();

    const movieCount = await Movie.count();
    const reviewCount = await Review.count();

    console.log(
      `✅ Seed complete. Movies: ${movieCount}, Reviews: ${reviewCount}`
    );
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

/* -------------------------------------------------------------------------- */

seedMovies();