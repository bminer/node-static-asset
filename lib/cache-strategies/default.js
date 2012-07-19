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
exports.lastModified = function(filename) {
	if(cache[filename] && cache[filename].lastModified)
		return cache[filename].lastModified;
	var stat = fs.statSync(filename);
	addToCache(filename, stat);
	return stat.mtime;
};
//Sets the ETag based upon the file size and CRC-32 hash
exports.etag = function(filename) {
	if(cache[filename] && cache[filename].etag)
		return cache[filename].etag;
	var data = fs.readFileSync(filename);
	if(!cache[filename] || !cache[filename].size)
		addToCache(filename, fs.statSync(filename) );
	return cache[filename].size + "-" + hash(data, "crc32");
};
//Set expiration date to one year from now
exports.expires = function(filename) {
	var d = new Date();
	d.setFullYear(d.getFullYear() + 1);
	return d;
};
