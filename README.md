# ⚡ SkillSphere: Intelligent Freelance Ecosystem

SkillSphere is a modern, AI-powered freelance marketplace designed to connect skilled freelancers with clients using advanced matching algorithms, real-time collaboration tools, and secure financial transactions.

## 🚀 Key Features

- **🤖 AI-Powered Matching**: Uses HuggingFace similarity scoring to match freelancers to gigs based on skill descriptions.
- **💬 Real-time Communication**: Instant messaging with typing indicators and file sharing built using Socket.IO.
- **💳 Secure Escrow Payments**: Milestone-based payment system integrated with Razorpay.
- **🛡️ Secure Authentication**:
  - Google OAuth 2.0 Integration.
  - Two-Factor Authentication (2FA) via Google Authenticator.
  - Email Verification via Nodemailer.
- **📊 Analytics Dashboards**: Role-specific dashboards for Clients, Freelancers, and Admins with detailed insights.
- **🕒 Availability Scheduler**: Advanced calendar management for freelancers to set their working hours.
- **⚖️ Dispute Management**: Dedicated system for handling and resolving project conflicts.

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Redux Toolkit (State Management)
- CSS3 (Modern/Glassmorphism UI)
- Socket.IO-client

**Backend:**
- Node.js & Express
- MongoDB & Mongoose (ODM)
- Passport.js (OAuth)
- Socket.IO
- Nodemailer

**AI & Third-Party:**
- HuggingFace API (Matching Algorithm)
- Razorpay API (Payments)
- Cloudinary (File/Image Uploads)

---

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js installed
- MongoDB URI
- Google Cloud Console Credentials (for OAuth)
- Razorpay Key & Secret
- HuggingFace API Token
- Cloudinary API Credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Geeta1923/Skillsphere.git
   cd Skillsphere
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file based on the environment variables mentioned below
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### 🔑 Environment Variables

Create a `.env` file in the `backend` directory with the following:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email
EMAIL_PASS=your_app_password

HUGGINGFACE_API_KEY=your_huggingface_token
```

---

## 📸 Screenshots & Demo
*(Coming Soon: Add your project screenshots here)*

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License
This project is licensed under the MIT License.

---
Built with ❤️ by [Geeta](https://github.com/Geeta1923)
