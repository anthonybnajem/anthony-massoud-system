## 🌟 Features

- ⚡ **Offline-first** – Operates smoothly without an internet connection
- 🛍️ **Sales & Inventory Management**
- 🧾 **Receipt Printing Support**
- 🧑‍💼 **Multi-user Login & Role-based Access**
- 📦 **Product and Category Management**
- 📊 **Sales Reporting Dashboard**
- 🌐 **Multi-language Support (Coming Soon)**
- 🔄 **Sync to Cloud (Optional Future Feature)**

---

## 📦 Tech Stack

- **Frontend**: React, Tailwind CSS
- **Desktop Shell**: Electron
- **Database (Offline)**: SQLite
- **Data Sync (Planned)**: FastAPI or Firebase
- **State Management**: Zustand or Redux Toolkit

---

## 🛠️ Installation

### Prerequisites

- Node.js (v18+)
- Git


### Environment Setup

Create a `.env.local` file in the root directory with the following:

```bash
# NextAuth Secret (required)
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth (optional, for cloud sync)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Note**: For development, a default secret is provided, but you should set `NEXTAUTH_SECRET` in production.
