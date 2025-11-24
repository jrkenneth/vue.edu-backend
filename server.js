const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://educlassuser:S0yRyqBvIofpWJNy@cluster0.uxkgluu.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority';
const DB_NAME = 'educlass';

let db;

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB Atlas');
        db = client.db(DB_NAME);
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Middleware: Enable CORS
app.use(cors());

// Middleware: Parse JSON bodies
app.use(express.json());

// Middleware: Logger - logs all requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    console.log('---');
    next();
});

// Middleware: Static file server for images
app.use('/images', (req, res, next) => {
    const imagePath = path.join(__dirname, 'images', req.path);
    
    // Check if file exists
    fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`Image not found: ${imagePath}`);
            return res.status(404).json({ 
                error: 'Image not found',
                message: `The requested image '${req.path}' does not exist`,
                path: req.path
            });
        }
        
        // File exists, serve it
        console.log(`Serving image: ${imagePath}`);
        res.sendFile(imagePath);
    });
});

// Route: GET /lessons - Return all lessons
app.get('/lessons', async (req, res) => {
    try {
        const lessons = await db.collection('lessons').find({}).toArray();
        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

// Route: GET /search - Search lessons by query
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        
        if (query.trim() === '') {
            // If no query, return all lessons
            const lessons = await db.collection('lessons').find({}).toArray();
            return res.json(lessons);
        }

        // Create a case-insensitive regex pattern
        const searchPattern = new RegExp(query, 'i');

        // Search across multiple fields
        const lessons = await db.collection('lessons').find({
            $or: [
                { subject: searchPattern },
                { location: searchPattern },
                { instructor: searchPattern },
                { price: isNaN(query) ? null : parseInt(query) }
            ]
        }).toArray();

        res.json(lessons);
    } catch (error) {
        console.error('Error searching lessons:', error);
        res.status(500).json({ error: 'Failed to search lessons' });
    }
});

// Route: POST /orders - Create a new order
app.post('/orders', async (req, res) => {
    try {
        const { name, phone, items, total } = req.body;

        // Validation
        if (!name || !phone || !items || !total) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'phone', 'items', 'total']
            });
        }

        // Validate name (letters only)
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(name)) {
            return res.status(400).json({ error: 'Name must contain letters only' });
        }

        // Validate phone (numbers only)
        const phoneRegex = /^[0-9]+$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Phone must contain numbers only' });
        }

        // Create order document
        const order = {
            name,
            phone,
            items, // Array of { lessonId, subject, quantity, price }
            total,
            timestamp: new Date(),
            status: 'confirmed'
        };

        // Insert into database
        const result = await db.collection('orders').insertOne(order);

        res.status(201).json({
            message: 'Order created successfully',
            orderId: result.insertedId,
            order: { ...order, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Route: PUT /lessons/:id - Update lesson attributes
app.put('/lessons/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;
        const updates = req.body;

        // Validate ObjectId
        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ error: 'Invalid lesson ID' });
        }

        // Remove _id from updates if present
        delete updates._id;

        // Update the lesson
        const result = await db.collection('lessons').updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Fetch and return updated lesson
        const updatedLesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });

        res.json({
            message: 'Lesson updated successfully',
            lesson: updatedLesson
        });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'EduClass API Server',
        version: '1.0.0',
        endpoints: {
            lessons: 'GET /lessons',
            search: 'GET /search?q=query',
            createOrder: 'POST /orders',
            updateLesson: 'PUT /lessons/:id',
            images: 'GET /images/:filename'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
});