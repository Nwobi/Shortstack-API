# ShortStack API

A high-performance URL shortening API built with TypeScript, Express, and SQLite.

## Features

- **URL Shortening**: Generate short, unique codes for long URLs
- **User Authentication**: Secure user registration and authentication
- **User Management**: Manage user profiles and permissions
- **Analytics**: Track and analyze click statistics on shortened URLs
- **Caching**: LRU cache for optimized performance
- **Database Migrations**: SQL-based database versioning and management
- **Comprehensive Testing**: Unit and integration tests with Vitest

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite with migrations
- **Testing**: Vitest
- **Caching**: Custom LRU Cache implementation

## Project Structure

```
src/
├── app.ts              # Express application setup
├── server.ts           # Server entry point
├── cache/              # Caching utilities
├── config/             # Configuration management
├── db/                 # Database setup and migrations
├── middleware/         # Custom middleware
├── modules/            # Feature modules
│   ├── analytics/      # Click tracking and analytics
│   ├── auth/           # Authentication
│   ├── links/          # URL shortening and management
│   └── users/          # User management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

tests/
├── unit/               # Unit tests
└── integration/        # Integration tests
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shortstack-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
npm run migrate
```

## Getting Started

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000` (or your configured port).

### Production

Build and start the production server:
```bash
npm run build
npm start
```

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run only unit tests:
```bash
npm run test:unit
```

Run only integration tests:
```bash
npm run test:integration
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Links
- `POST /links` - Create a short URL
- `GET /links/:shortCode` - Redirect to original URL
- `GET /links/:shortCode/stats` - Get analytics for a URL
- `PUT /links/:shortCode` - Update a short URL
- `DELETE /links/:shortCode` - Delete a short URL

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/:userId` - Delete user account

## Configuration

Configuration is managed through environment variables. Key variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT secret for authentication

## Performance Optimization

The API includes several performance optimizations:

- **LRU Cache**: Caches frequently accessed URLs to reduce database queries
- **Connection Pooling**: Efficient database connection management
- **Response Compression**: Gzip compression for API responses

## Database Migrations

Migrations are located in `src/db/migrations/`. To add a new migration:

1. Create a new SQL file with format `XXX_description.sql`
2. Add your migration SQL
3. Run `npm run migrate` to apply

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
