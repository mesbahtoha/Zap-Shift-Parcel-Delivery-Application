# ⚡ ZapShift — Parcel Delivery Application

> A full-stack parcel delivery management platform connecting **Users**, **Riders**, and **Admins** through a centralized, real-time logistics system.

![ZapShift Banner](https://img.shields.io/badge/ZapShift-Parcel%20Delivery-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen?style=flat-square&logo=mongodb)
![Firebase](https://img.shields.io/badge/Firebase-Auth-yellow?style=flat-square&logo=firebase)

---

## 🔗 Live Demo & Repository

- 🌐 **Live Site:** [zapshift.netlify.app](#) *(replace with your live URL)*
- 💻 **Client Repo:** [GitHub — Client](https://github.com/mesbahtoha/Zap-Shift-Parcel-Delivery-Application)
- 🖥️ **Server Repo:** *(add your server repo link here)*

---

## 📌 Project Overview

**ZapShift** is a modern, full-stack parcel delivery web application. It eliminates manual logistics processes by providing a streamlined platform where users can book parcels, riders manage deliveries, and admins oversee the entire operation with real-time insights.

The platform supports **three distinct user roles**, each with a dedicated dashboard and feature set:

| Role | Key Responsibilities |
|------|----------------------|
| 👤 **User** | Book parcels, pay charges, track status, review service |
| 🏍️ **Rider** | Collect & deliver parcels, update statuses, OTP confirmation |
| 🛠️ **Admin** | Assign riders, manage routing, oversee warehouses, monitor operations |

---

## ✨ Key Features

### 👤 User Features
- Secure **registration & login** via Firebase Authentication
- **Book parcels** with detailed sender & receiver information
- **Real-time parcel tracking** with live status updates
- **Stripe payment integration** for delivery charges
- **Parcel history** — view all past deliveries with cost & status
- Submit **service reviews and ratings**

### 🏍️ Rider Features
- View **assigned deliveries** with full parcel & contact details
- **Update delivery status** — Picked Up → In Transit → Delivered
- **OTP-based secure delivery** confirmation
- **Live location sharing** for tracking purposes
- **Daily summary** of parcel count and earnings

### 🛠️ Admin Features
- **User & Rider Management** — add, edit, or remove accounts
- **Parcel Oversight** — monitor all active/inactive parcels and payments
- **Analytics Dashboard** — delivery stats, revenue & performance indicators
- **Region & Warehouse Management** — assign riders to specific areas
- **Manual Overrides** — update parcel status or reassign riders

---

## 🚀 Delivery Flow

```
User Books Parcel (Unpaid)
        ↓
User Pays → Status: Paid
        ↓
Admin Assigns Rider → Status: Ready to Pickup
        ↓
Rider Picks Up → Status: In Transit
        ↓
Within City?
  ├── YES → Rider Delivers → Status: Delivered ✅
  └── NO  → Sent to Warehouse → Shipped to Destination → Rider Delivers → Status: Delivered ✅
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React** | Core UI framework (NPM package) |
| **React Router DOM** | Client-side routing & navigation |
| **Tailwind CSS** | Utility-first styling |
| **DaisyUI** | Pre-built Tailwind component library |
| **Lucide React** | Modern icon library |
| **React Icons** | Additional icon sets |
| **Urbanist Font** | Custom typography (imported via index.css) |
| **React Responsive Carousel** | Homepage banner/slider |
| **React Fast Marquee** | Scrolling announcement banners |
| **React AOS** | Scroll-triggered animations |
| **React Hook Form** | Performant form handling & validation |
| **React Select** | Advanced dropdown/select component |
| **React Leaflet** | Interactive map integration |
| **MapContainer, TileLayer, Marker, Popup** | Map components for parcel tracking |

### Authentication & Backend Services
| Technology | Purpose |
|---|---|
| **Firebase** | Authentication & cloud services |
| **Firebase Admin SDK** | Server-side Firebase operations |
| **JWT (JSON Web Tokens)** | Secure route protection & authorization |

### Payments & Notifications
| Technology | Purpose |
|---|---|
| **React Stripe JS** | Stripe payment integration |
| **Nodemailer** | Email notifications to users |
| **SweetAlert2** | Beautiful alert/confirmation dialogs |
| **sweetalert2-react-content** | React integration for SweetAlert2 |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | RESTful API framework |
| **MongoDB** | NoSQL database for data persistence |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |
| **UUID** | Unique ID generation for parcels |

### Data Fetching
| Technology | Purpose |
|---|---|
| **TanStack Query (React Query)** | Server state management — replaces useEffect for data loading |
| **Axios** | HTTP client for API requests |

---

## 🏗️ Project Structure

```
zap-shift/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Images, fonts, icons
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Home/
│   │   │   ├── Dashboard/
│   │   │   │   ├── User/
│   │   │   │   ├── Rider/
│   │   │   │   └── Admin/
│   │   │   └── Auth/
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # React Context providers
│   │   ├── routes/             # Protected route configuration
│   │   └── index.css           # Tailwind + Urbanist font import
│   └── package.json
│
└── server/                     # Node.js Backend
    ├── routes/                 # API route handlers
    ├── middleware/             # JWT auth middleware
    ├── config/                 # DB & Firebase config
    ├── .env                    # Environment variables
    └── index.js                # Server entry point
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js **v16 or higher**
- npm or yarn
- MongoDB Atlas account
- Firebase project
- Stripe account

### 1. Clone the Repository
```bash
git clone https://github.com/mesbahtoha/Zap-Shift-Parcel-Delivery-Application.git
cd Zap-Shift-Parcel-Delivery-Application
```

### 2. Frontend Setup
```bash
cd client
npm install
```

Create a `.env` file in the `client` folder:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_API_BASE_URL=http://localhost:5000
```

```bash
npm run dev
```

### 3. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_ADMIN_SDK=your_firebase_admin_config
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

```bash
node index.js
```

---

## 💳 Pricing Structure

| Parcel Type | Weight | Within City | Outside City |
|---|---|---|---|
| Document | Any | ৳60 | ৳80 |
| Non-Document | Up to 3kg | ৳110 | ৳150 |
| Non-Document | Above 3kg | +৳40/kg | +৳40/kg (+৳40 extra) |

**Rider Earnings:**
- ৳80% of delivery charge for same-city deliveries
- ৳60% for outside city/district deliveries

---

## 🔐 Security Features

- **JWT Authentication** — Protected API routes with token-based auth
- **Firebase Auth** — Secure client-side authentication
- **Role-Based Access Control (RBAC)** — Separate permissions for User, Rider, and Admin
- **Environment Variables** — Sensitive credentials stored in `.env` files
- **CORS Configuration** — Controlled cross-origin access
- **OTP Delivery Confirmation** — Prevents unauthorized parcel collection

---

## 📦 NPM Packages Summary

```json
"dependencies": {
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x",
  "daisyui": "^4.x",
  "react-responsive-carousel": "latest",
  "react-icons": "latest",
  "react-fast-marquee": "latest",
  "aos": "latest",
  "react-hook-form": "latest",
  "firebase": "latest",
  "react-leaflet": "latest",
  "react-select": "latest",
  "sweetalert2": "latest",
  "sweetalert2-react-content": "latest",
  "uuid": "latest",
  "@tanstack/react-query": "latest",
  "@stripe/react-stripe-js": "latest",
  "axios": "latest",
  "lucide-react": "latest"
}
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Mesbah Toha**
- GitHub: [@mesbahtoha](https://github.com/mesbahtoha)
- LinkedIn: *(add your LinkedIn profile)*
- Email: *(add your contact email)*

---

<p align="center">Made with ❤️ by Mesbah Toha | ⚡ ZapShift — Delivering Fast, Delivering Smart</p>
