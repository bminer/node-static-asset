var paths = exports.paths = {
	'root': process.cwd(),
	'client-js': '/client',
	'client-lib': '/client/lib',
	'views': '/views',
	'css': '/css',
	'output': '/public',
	'images': '/public/images'
};

exports.defaultConfig = {
	'all': function() {
		//Coffee
		if(coffee)
			this.register('coffee', function() {
				return coffee.compile(body);
			});
		
		//CSS
		if(stylus)
			this.register(['styl', 'css'], function(body, filename, cb) {
				//'this' still refers to 'asset'
				stylus(body, this.get('stylus'))
					.set('filename', filename)
					.set('compress',  || true)
					.include(__dirname + '/../css/')
					.render(cb);
			});
		
		//Jade views
		if(jade)
			this.register('jade', function(body, filename, cb) {
				var opts = asset.get('jade');
				opts.filename = filename;
				opts.client = true;
				try {
					var fn = jade.compile(body, opts);
					cb(null, fn.toString() );
				} catch(e) {
					cb(e);
				}
			});
	},
	'development': function() {
		this.set('stylus', {
			'compress': false,
			'warn': true,
			'linenos': true
		});
		this.set('jade', {
			'debug': true,
			'compileDebug': true
		});
	},
	'production': function() {
		this.set('jade', {
			'compileDebug': false
		});
	}
};