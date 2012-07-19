module.exports = staticAsset;
function staticAsset(path, strategy) {
	var labels = {},
		fingerprints = {};
	if(strategy == null)
		strategy = staticAsset.strategies["default"];
	//Return Express middleware
	return function(req, res, next) {
		//If req.assetFingerprint is already there, do nothing.
		if(req.assetFingerprint)
			return next();
		//Create req.assetFingerprint
		function addFingerprint(fingerprint, headers) {
			fingerprints[fingerprint] = headers;
			return fingerprint;
		}
		req.assetFingerprint = function(label, fingerprint, cacheInfo) {
			if(arguments.length == 1)
			{
				//Add a label
				var labelInfo = labels[label] = {"fingerprint": fingerprint};
				for(var i in cacheInfo)
					labelInfo[i] = cacheInfo[i];
			}
			else
			{
				//Get a fingerprint
				var info = labels[label];
				if(info)
					return addFingerprint(info.fingerprint, {"ETag": info.etag,
						"Last-Modified": info.lastModified});
				else
				{
					//Use the "cache strategy" to get a fingerprint
					//Prefer the use of etag over lastModified when generating
					//fingerprints
					var expires = cacheStrategy.expires ||
						staticAsset.strategies["default"].expires;
					expires = expires(label);
					var headers = {
						"Expires": expires //TODO: add Cache-Control: max-age=
					};
					if(cacheStrategy.etag)
					{
						var etag = cacheStrategy.etag(label);
						headers["ETag"] = etag;
						return addFingerprint(label + "?v=" + etag,	headers);
					}
					else if(cacheStrategy.lastModified)
					{
						var mdate = cacheStrategy.lastModified(label);
						headers["Last-Modified"] = mdate;
						return addFingerprint(label + "?v=" + mdate.getTime(),
							headers);
					}
					else
						return label; //Do not generate a fingerprint
				}
			}
		};
		//Also, proxy res.end
		var end = res.end;
		res.end = function() {
			//If this request matches a fingerprint
			var info = fingerprints[req.url];
			if(info)
				//then set appropriate headers
				for(var i in info)
					res.setHeader(i, info[i]);
			//Put everything back
			res.end = end;
			res.end.apply(this, arguments);
		};
		next();
	};
};

//Expose cache strategies
staticAsset.strategies = require("./cache-strategies");
