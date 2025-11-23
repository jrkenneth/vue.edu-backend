const express = require('express');

const path = require('path');
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 3000;






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