# Todo Backend

Backend API untuk aplikasi todo dengan fitur tasks, categories, notifications, dan authentication.

## Fitur

- **Authentication** - User login dan register dengan JWT
- **Tasks Management** - Create, read, update, delete tasks
- **Categories** - Organize tasks dengan categories
- **Notifications** - Real-time notifications untuk users
- **Testing** - Unit dan integration tests dengan Jest
- **Database** - MySQL/PostgreSQL support
- **Vercel Deployment Ready** - Configured untuk deploy ke Vercel
- **Aiven** - Deployment database

## Tech Stack

- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **MySQL/PostgreSQL** - Database
- **JWT** - Authentication
- **Jest** - Testing framework
- **Vercel** - Deployment platform

## Prerequisites

- Node.js (v16 atau lebih tinggi)
- npm atau yarn
- MySQL atau PostgreSQL database

## Setup

### Installation

1. Clone repository
```bash
git clone https://github.com/HUSNUL-MUTMAINNAH/todo-backend.git
cd todo-backend
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan dengan konfigurasi Anda:
```
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/todo_db
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Database Setup

1. Buat database baru:
```sql
CREATE DATABASE todo_db;
```

2. Setup database dengan script:
```bash
npm run db:setup
```

Atau manual import schema:
```bash
mysql -u user -p todo_db < db/init.sql
```

### Development

Jalankan development server:
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Testing

Jalankan test suite:
```bash
npm test
```

Coverage report:
```bash
npm run test:coverage
```

### Production

Build dan jalankan untuk production:
```bash
npm start
```

## Struktur Project

```
├── config/              # Configuration files
│   └── db.js           # Database configuration
├── controllers/        # Business logic
│   ├── authController.js
│   ├── taskController.js
│   ├── categoryController.js
│   └── notificationController.js
├── models/             # Database models
│   ├── User.js
│   ├── Task.js
│   ├── Category.js
│   └── Notification.js
├── routes/             # API routes
│   ├── authRoutes.js
│   ├── taskRoutes.js
│   ├── categoryRoutes.js
│   └── notificationRoutes.js
├── middlewares/        # Custom middleware
│   ├── authMiddleware.js
│   └── validationMiddleware.js
├── db/                 # Database files
│   ├── init.sql       # Database schema
│   └── setup.js       # Database setup script
├── tests/              # Test files
└── server.js          # Main server entry point
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Tasks
- `GET /api/tasks` - Get semua tasks (requires auth)
- `GET /api/tasks/:id` - Get detail task
- `POST /api/tasks` - Create task baru (requires auth)
- `PUT /api/tasks/:id` - Update task (requires auth)
- `DELETE /api/tasks/:id` - Delete task (requires auth)

### Categories
- `GET /api/categories` - Get semua categories
- `GET /api/categories/:id` - Get detail category
- `POST /api/categories` - Create category baru
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Notifications
- `GET /api/notifications` - Get notifications untuk user (requires auth)
- `GET /api/notifications/:id` - Get detail notification
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

## Authentication

API menggunakan JWT untuk autentikasi. Setelah login, sertakan token di header:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables

Diperlukan konfigurasi di file `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| DATABASE_URL | Database connection string | - |
| JWT_SECRET | Secret key untuk JWT | - |
| NODE_ENV | Environment (development/production) | development |

## Scripts

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "db:setup": "node db/setup.js"
}
```

## Error Handling

API mengembalikan response dengan format standar:

Success:
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

Error:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Error message"
}
```

## Testing

Menggunakan Jest untuk unit dan integration testing. Test coverage sudah mencakup:
- Authentication flows
- Task CRUD operations
- Category management
- Notification system
- Health checks

## Deployment ke Vercel

1. Push code ke GitHub
2. Connect repository ke Vercel
3. Setup environment variables di Vercel dashboard:
   - DATABASE_URL
   - JWT_SECRET
4. Deploy!

Vercel akan otomatis deploy ketika ada push ke branch main.

## Database Migration

Jika ada perubahan schema:
1. Update file `db/init.sql`
2. Update models di folder `models/`
3. Run setup script atau manual migration

## API Documentation

Untuk dokumentasi lengkap API, gunakan tools:
- Postman - Import dan test semua endpoints
- Thunder Client - VSCode extension untuk testing
- curl - Command line testing

## Support

Untuk pertanyaan atau issues, buat issue di GitHub repository.

## License

MIT
