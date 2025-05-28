const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1 }, 'your_jwt_secret'); // For user 1
console.log(token);
