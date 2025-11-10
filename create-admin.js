const bcrypt = require('bcryptjs');

const password = 'Tigro#2024$Secure!';
const hash = bcrypt.hashSync(password, 10);

console.log('Hashed password:', hash);
