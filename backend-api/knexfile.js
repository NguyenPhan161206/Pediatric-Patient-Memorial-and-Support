require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'db_admin',
      password: process.env.POSTGRES_PASSWORD || 'secure_password_2026',
      database: process.env.POSTGRES_DB || 'warrior_hub_db'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/shared/database/migrations'
    },
    seeds: {
      directory: './src/shared/database/seeds'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/shared/database/migrations'
    },
    seeds: {
      directory: './src/shared/database/seeds'
    }
  }
};
