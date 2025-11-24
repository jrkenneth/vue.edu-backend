# EduClass Backend API

Express.js REST API for the EduClass after-school activities booking system.

## Live API
🌐 Render.com URL: https://edu-backend-ken.onrender.com/

## Endpoints

- `GET /lessons` - Get all lessons
- `GET /search?q=query` - Search lessons
- `POST /orders` - Create new order
- `PUT /lessons/:id` - Update lesson
- `GET /images/:filename` - Get lesson image

## Tech Stack
- Node.js
- Express.js
- MongoDB Atlas (native driver)

## Installation

1. Clone the repository:
```bash
   git clone https://github.com/jrkenneth/vue.edu-backend.git
```

2. Install dependencies:
```bash
   npm install
```

3. Create `.env` file with your MongoDB URI:
MONGODB_URI=your_mongodb_connection_string
PORT=3000

4. Run the server:
```bash
   npm start
```

## Testing

See Postman collection for API testing examples.