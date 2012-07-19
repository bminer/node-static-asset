var crypto = require('crypto'),
	crc = require('crc');
/* A hashing function that accepts data and returns the hash from the
specified algorithm. Works for Buffers and strings. */
module.exports = function(data, algorithm) {
	if(data instanceof Buffer && crc.buffer[algorithm])
		return crc.buffer[algorithm](data);
	else if(crc[algorithm])
		return crc[algorithm](data);
	else
		return crypto.createHash(algorithm).update(data).digest('hex');
};
