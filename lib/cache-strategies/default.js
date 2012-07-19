var hash = require('../hash'),
	cache = {}, //filename => {"mtime": dateObject, "etag": string, "size": fileSize}
	cacheOn = process.env.NODE_ENV == "production";
//Adds information to the cache
function addToCache(filename, obj) {
	if(cacheOn)
	{
		var x = cache[filename];
		if(!x)
			x = cache[filename] = {};
		x.mtime = obj.mtime || x.mtime;
		x.etag = obj.etag || x.etag;
		x.size = obj.size || x.size;
	}
}
//Sets the Last-Modified date based upon the mtime of the file
exports.lastModified = function(filename, cb) {
	if(cache[filename] && cache[filename].lastModified)
		return cb(null, cache[filename].lastModified);
	fs.stat(filename, function(err, stat) {
		if(err) return cb(err);
		addToCache(filename, stat);
		cb(null, stat.mtime);
	});
};
//Sets the ETag based upon the file size and CRC-32 hash
exports.etag = function(filename, cb) {
	if(cache[filename] && cache[filename].etag)
		return cb(null, cache[filename].etag);
	fs.readFile(filename, function(err, data) {
		if(err) return cb(err);
		if(cache[filename] && cache[filename].size)
			next();
		else
			fs.stat(filename, function(err, stat) {
				if(err) return cb(err);
				addToCache(filename, stat);
				next();
			};
		function next() {
			cb(null, cache[filename].size + "-" + hash(data, "crc32") );
		}
	});
};
//Set expiration date to one year from now
exports.expires = function(filename, cb) {
	var d = new Date();
	d.setFullYear(d.getFullYear() + 1);
	cb(null, d);
};
