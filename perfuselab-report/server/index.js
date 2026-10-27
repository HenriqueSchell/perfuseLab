const express = require('express');
const path = require('path');
const reportRouter = require('./routes/report');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../src')));

// Use the report routes
app.use('/report', reportRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});