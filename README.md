# Titan Cargo
### Advanced Cargo Management Dashboard

A logistics and cargo tracking and management system.

### 🌐 [Live Demo](https://titan-cargo.onrender.com)

---

## 📋 Table of Contents
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [Deployment](#-deployment)
- [Features](#-features)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🛠 Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/)
- npm (comes with Node.js)

---

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TitanBackend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your configuration:
   ```env
   PORT=3000
   DATABASE_URL=postgres://username:password@localhost:5432/titan_db
   JWT_SECRET=your_jwt_secret
   ```

4. **Database Setup:**
   Ensure your PostgreSQL server is running and create a database named `titan_db`.

---

## 💻 Usage

### Development Mode
Run the server with hot-reloading using `nodemon`:
```bash
npm run dev
```

### Production Mode
Start the production server:
```bash
npm start
```

---

## ☁️ Deployment

### 1. GitHub
1. Create a new repository on GitHub.
2. Initialize git in your local folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
   *Note: `node_modules` and `.env` are automatically ignored.*

### 2. Render (Backend)
1. **Create a Database**: In Render dashboard, click "New" -> "PostgreSQL".
2. **Create a Web Service**: Click "New" -> "Web Service" and connect your GitHub repo.
3. **Configure Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Add Environment Variables**:
   - `DATABASE_URL`: (Copy the "External Database URL" from your Render PostgreSQL)
   - `JWT_SECRET`: (Your secret key)
   - `FRONTEND_ORIGIN`: (The URL of your hosted site)

---

## ✨ Features

- **🔐 Authentication & Authorization**: Secure JWT-based authentication with Role-Based Access Control (RBAC).
- **📦 Booking Management**: Create, track, and manage cargo bookings efficiently.
- **🚛 Trip Tracking**: Real-time management of vehicle trips and deliveries.
- **📋 Admin Dashboard**: Comprehensive administrative tools for system management.
- **🚗 Vehicle Management**: Maintain a detailed registry of transport vehicles.
- **💾 PostgreSQL Integration**: Robust data persistence using PostgreSQL.

---

## 🤝 Contributing

We welcome contributions! To contribute:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

Please ensure your code follows the existing style and includes appropriate documentation.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🎓 Acknowledgments / Credits

- **Norris Frank**: For the implementation of Role-Based Access Control (RBAC).
- **My Father and friends**: For the invaluable guidance, tips, and academic support throughout the project.
- **Dribbble**: For the UI/UX design inspirations that helped shape the dashboard.
