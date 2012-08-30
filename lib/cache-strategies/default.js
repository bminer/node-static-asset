var hash = require('../hash'),
    fs = require('fs'),
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
	var data = fs.readFileSync(filename),
		size;
	if(cache[filename] && cache[filename].size)
		size = cache[filename].size;
	else
	{
		var stat = fs.statSync(filename);
		addToCache(filename, stat);
		size = stat.size;
	}
	return new Number(size).toString(36) + "-" +
		new Number(hash(data, "crc32") + 0x80000000).toString(36);
};
//Set expiration date to one year from now
exports.expires = function(filename) {
	var d = new Date();
	d.setFullYear(d.getFullYear() + 1);
	return d;
};