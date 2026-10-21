# BookNest 📚

> A full-stack online bookstore built for BBACA second-year college project submission.

[![CI](https://github.com/shubhXlab/booknest/actions/workflows/ci.yml/badge.svg)](https://github.com/shubhXlab/booknest/actions/workflows/ci.yml)
[![Deploy](https://github.com/shubhXlab/booknest/actions/workflows/deploy.yml/badge.svg)](https://github.com/shubhXlab/booknest/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Live Demo

- **Frontend**: https://booknest.pagecraft.website
- **API**: https://booknest.pagecraft.website/api

## ✨ Features

### Customer Features
- 🏠 **Home Page** — Featured books, categories, search
- 📚 **Book Catalog** — Browse, filter by category, search by title/author
- 📖 **Book Detail** — Description, price, stock, add to cart
- 🛒 **Shopping Cart** — Add/update/remove items, quantity validation
- 💳 **Checkout** — Address form, order summary, payment simulation
- 👤 **User Profile** — Order history, order details, account info

### Authentication
- 🔐 **JWT Authentication** — Register, login, protected routes
- 👮 **Role-based Access** — Customer vs Admin middleware
- 💾 **Token Persistence** — localStorage with auto-refresh

### Admin Panel
- 📊 **Dashboard** — Total books, users, orders, revenue
- 📚 **Book Management** — Create, edit, delete books
- 📦 **Order Management** — View all orders, update status
- 👥 **User Management** — View all registered users

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router 6, Axios |
| **Backend** | Node.js, Express, sql.js (SQLite WASM) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Validation** | express-validator |
| **Dev Tools** | ESLint, TypeScript, Vitest, Playwright |
| **CI/CD** | GitHub Actions (lint → type-check → test → build → deploy) |
| **Deployment** | cPanel/WHM via SSH/rsync (PM2 or Passenger) |

## 📁 Project Structure

```
booknest/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context (Auth, Cart)
│   │   ├── pages/          # Page components (8 pages)
│   │   ├── services/       # API service layer
│   │   └── styles/         # Global styles & Tailwind
│   ├── tailwind.config.js  # Design system tokens
│   └── vite.config.js      # Vite config with API proxy
├── server/                 # Express backend
│   ├── config/             # Database & app config
│   ├── middleware/         # Auth, validation, error handling
│   ├── routes/             # API routes (auth, books, cart, orders, admin)
│   ├── scripts/            # DB schema, seed, admin creation
│   └── tests/              # Unit & integration tests
├── .github/workflows/      # CI/CD pipelines
├── booknest-design-system/ # Locked design tokens & components
├── docker-compose.yml      # Local development
├── DEPLOY.md               # cPanel/WHM deployment guide
└── TEST_PLAN.md            # QA test plan & results
```

## 🏁 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Local Development

```bash
# Clone the repo
git clone https://github.com/shubhXlab/booknest.git
cd booknest

# Install dependencies
cd server && npm install
cd ../client && npm install

# Initialize database (creates tables & seeds data)
cd ../server && npm run init-db

# Start development servers (both frontend & backend)
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Default Admin Credentials
```
Email: admin@booknest.com
Password: admin123
```

## 🧪 Testing

```bash
# Backend unit & integration tests
cd server && npm test

# Frontend E2E tests
cd client && npm run test:e2e

# Run all tests (CI pipeline)
npm run test:all
```

## 🚀 Deployment

See [DEPLOY.md](DEPLOY.md) for complete cPanel/WHM deployment guide.

### GitHub Actions Secrets Required

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | cPanel/WHM hostname or IP |
| `DEPLOY_USER` | cPanel username |
| `DEPLOY_PATH` | Deployment path (e.g., `/home/user/booknest`) |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment |
| `JWT_SECRET` | Production JWT secret |
| `FRONTEND_URL` | Production frontend URL |

### Deploy to cPanel/WHM

1. Add secrets above in GitHub repo settings
2. Push to `main` branch → auto-deploys via SSH/rsync
3. Or use FTP fallback if SSH unavailable

## 📚 API Endpoints

### Public
- `GET /api/books` — List all books (with filters)
- `GET /api/books/categories` — List categories
- `GET /api/books/:id` — Get book detail
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user

### Protected (User)
- `GET /api/auth/me` — Current user profile
- `GET /api/cart` — Get cart
- `POST /api/cart` — Add to cart
- `PUT /api/cart/:bookId` — Update quantity
- `DELETE /api/cart/:bookId` — Remove item
- `DELETE /api/cart` — Clear cart
- `POST /api/orders` — Create order from cart
- `GET /api/orders` — User order history
- `GET /api/orders/:id` — Order detail

### Admin Only
- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/books` — All books (admin view)
- `POST /api/admin/books` — Create book
- `PUT /api/admin/books/:id` — Update book
- `DELETE /api/admin/books/:id` — Delete book
- `GET /api/admin/orders` — All orders
- `PUT /api/admin/orders/:id/status` — Update order status
- `GET /api/admin/users` — All users

## 🎨 Design System

The project uses a locked design system at `/booknest-design-system/` with:
- Color palette (primary, secondary, neutral, semantic)
- Typography scale (headings, body, captions)
- Spacing system (4px base unit)
- Shadow & elevation tokens
- Border radius scale
- Breakpoints (mobile, tablet, desktop)
- Component tokens (buttons, inputs, cards, badges)

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

**Shubham Ramjiyani** — BBACA Second Year Student  
GitHub: [@shubhXlab](https://github.com/shubhXlab)

## 🙏 Acknowledgments

- Built as a college project submission for BBACA 2nd year
- Design system inspired by modern e-commerce patterns
- Deployed on cPanel/WHM with PM2/Passenger