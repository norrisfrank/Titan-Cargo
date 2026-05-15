# Titan Cargo
### Advanced Cargo Management Dashboard

A comprehensive logistics, cargo tracking, and management system.

**Live Demo:** [https://titan-backend-igvr.onrender.com](https://titan-backend-igvr.onrender.com)

## Table of Contents
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [Deployment](#deployment)
* [Features](#features)
* [Contributing](#contributing)
* [License](#license)
* [Acknowledgments](#acknowledgments)

## Prerequisites
Before you begin, ensure you have the following installed in your environment:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [PostgreSQL](https://www.postgresql.org/)
* npm (included with Node.js)

## Installation

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
   Create a `.env` file in the root directory and define the following configuration variables:
   ```env
   PORT=3000
   DATABASE_URL=postgres://username:password@localhost:5432/titan_db
   JWT_SECRET=your_jwt_secret
   ```

4. **Database Setup:**
   Ensure your PostgreSQL instance is active and create a database named `titan_db`.

## Usage

### Development Mode
Execute the server with hot-reloading enabled via `nodemon`:
```bash
npm run dev
```

### Production Mode
Initialize the production server:
```bash
npm start
```

## Deployment

### GitHub Repository Initialization
1. Create a new repository on GitHub.
2. Initialize source control in your local directory:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
   *Note: `node_modules` and `.env` are automatically excluded via `.gitignore`.*

### Render Platform (Backend)
1. **Provision Database:** In the Render dashboard, navigate to New > PostgreSQL to provision a new instance.
2. **Deploy Web Service:** Navigate to New > Web Service and connect the GitHub repository.
3. **Configure Service Settings:**
   * Environment: `Node`
   * Build Command: `npm install`
   * Start Command: `npm start`
4. **Define Environment Variables:**
   * `DATABASE_URL`: The Internal/External Database URL from your Render PostgreSQL instance.
   * `JWT_SECRET`: Your secure cryptographic key.
   * `FRONTEND_ORIGIN`: The designated URL of your hosted client application.

## Features

* **Authentication & Authorization:** Secure, JWT-based authentication architecture utilizing Role-Based Access Control (RBAC).
* **Booking Management:** Interface to create, trace, and organize cargo operations systematically.
* **Trip Tracking:** Real-time oversight of transport vehicles and delivery statuses.
* **Administrative Dashboard:** Centralized administrative suite for robust system oversight.
* **Vehicle Fleet Management:** Comprehensive registry and maintenance log for the transport fleet.
* **Data Persistence:** Relational data management integrated through PostgreSQL.

## Contributing

We encourage and welcome contributions. To contribute to this repository:
1. Fork the project repository.
2. Create a dedicated feature branch (`git checkout -b feature/FeatureName`).
3. Commit your modifications (`git commit -m 'Implement FeatureName'`).
4. Push the branch to your fork (`git push origin feature/FeatureName`).
5. Submit a Pull Request for review.

Please ensure all code adheres to the established formatting guidelines and includes comprehensive documentation.

## License

This project is distributed under the MIT License. Reference the [LICENSE](LICENSE) file for complete details.

## Acknowledgments

* **Norris Frank:** For architecting the Role-Based Access Control (RBAC) implementation.
* **Advisors and Colleagues:** For providing critical feedback, guidance, and academic support throughout the development lifecycle.
* **Dribbble:** For foundational UI/UX paradigms that influenced the dashboard architecture.
