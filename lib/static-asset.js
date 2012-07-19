module.exports = staticAsset;
function staticAsset(path, cache) {
	return function(req, res, next) {
		next();
	};
};

//Expose cache strategies
staticAsset.strategies = require("./cache-strategies");
