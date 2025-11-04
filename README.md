# VolunteerHub

BTL cho môn Phát triển ứng dụng Web - INT 3306_2. Các thành viên của nhóm bao gồm:
- Lê Anh Duy - 23021501
- Phạm Ngọc Hải Dương - 23021517
- Nguyễn Vũ Minh - 23020629

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + Vite |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | MongoDB (via Mongoose) |
| Authentication | JWT + bcryptjs |
| API Communication | REST (JSON) |

---

## Directory

```
volunteerhub/
├── server/               # Backend folder
│   ├── config/           # DB connection
│   ├── controllers/      # Logic for routes
│   ├── middleware/       # JWT auth
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── .env              # Environment variables
│   └── server.js         # Backend entry point
│
├── src/                  # Frontend (React)
│   ├── components/       # Shared UI components
│   ├── context/          # Auth context
│   ├── pages/            # Page views
│   ├── api/              # API calls
│   ├── routes/           # Route config
│   └── main.jsx          # React entry
│
├── .gitignore
├── package.json
└── README.md
```

---

## Setup
### Backend Setup (Node.js + MongoDB)

1. Tải các dependencies
```bash
$ cd server
$ npm install
 ```

2. Tạo file `.env` trong server `/server` như sau:

```bash
PORT=5000
MONGO_URI=<connection_string>
JWT_SECRET=mysecretkey123
```

3. Chạy dev server:

```bash
$ npm run dev
```

Backend sẽ chạy ở **[http://localhost:5000](http://localhost:5000)**

---

### Frontend Setup (React + Vite)

1. Mở một terminal mới và truy cập đến project

```bash
$ cd volunteerhub
```

3. Tải các dependencies:

```bash
$ npm install
```

4. Chạy dev frontend

```bash
$ npm run dev
```

Frontend sẽ chạy tại **[http://localhost:5173](http://localhost:5173)**
