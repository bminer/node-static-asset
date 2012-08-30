#node-static-asset

node-static-asset is a static asset manager for Node.JS, designed for Express.
This project aims to solve the problem of caching static assets (including
assets like *.js files that might change from time to time).

## Background

Google has a nice article about "strong" and "weak" caching.  It's worth a quick
read if you don't know what that means.

https://developers.google.com/speed/docs/best-practices/caching

## Getting Started

node-static-asset allows you to generate URL fingerprints for static assets.

1. Add the static-asset middleware to your Express stack
```javascript
var staticAsset = require('static-asset');
app.use(staticAsset(__dirname + "/public/") );
```

2. Get URL fingerprints of your static resources using `req.assetFingerprint`
or the `assetFingerprint` view helper function.
```javascript
app.get("/info", function(req, res, next) {
	res.type("text/plain").send("The URL fingerprint for jQuery is: " +
		req.assetFingerprint("/js/jquery.min.js") );
});
```

The above gives you weak and strong caching for all files served in the /public
directory.  But, that's not all; static-asset has many more features that allow
you to customize how files are cached and how to generate URL fingerprints. You
can even write your own middleware that minifies JavaScript files, for example,
and use static-asset to serve them to the browser.

## API

The API for static-asset is quite simple. Simply add the static-asset
middleware, and you get a `assetFingerprint` function attached to each Request
Object.

**require('static-asset')(path[, options])** - Returns an Express middleware
function that exposes a `req.assetFingerprint` function and adds
`assetFingerprint` view helper function.  If any request's URL matches a
previously generated URL fingerprint, static-asset will attempt to add weak and
strong caching headers to the response.

- `path` - the path from which static files are served
- `options` - The options are:
    - `cache` - a "cache strategy" Object, which must implement all "cache
	   strategy" methods, as described below. If `cache` is omitted, the
	   default "cache stategy" is used.
    - `set_expires_headers` - set to false to disable setting `Expires` and
       `Cache-Control` headers (default: `true`)
    - `debug` - set to true to enable console logging (default: `false`)

**"Cache Strategy" Object** - a "cache strategy" object should implement one or
more of the following methods:

- `lastModified(filename)` - a function that accepts a filename and returns
	its last modified date. If a last modified date could not
	be determined, the function should return `null`; otherwise, static-asset
	*may* use this Date to set the `Last-Modified` HTTP response header when
	the resource is requested.
- `etag(filename, cb)` - Same as lastModified (above), except that it must
	return an ETag (or hash value).  If the
	returned ETag is not `null`, static-asset *may* use this value to set the
	`ETag` HTTP header when the named resource is requested.
- `expires(filename)` - Same as lastModified (above), except
	that it must return a Date Object indicating when the resource shall
	expire. The Date may be no more than one year in the future. If
	`expires` is implemented, static-asset *may* use the date to set an
	`Expires` and/or `Cache-Control: max-age` HTTP headers; otherwise,
	static-asset will use a Date approximately one year into the future.

**req.assetFingerprint(label_or_filename)** - Return a URL fingerprint for the
labelled resource, or if no such label is registered, use the "cache
strategy" to determine the file's ETag or last modified date. If an ETag is
provided by the cache strategy, it will be used to generate the fingerprint;
otherwise, the last modified date will be used.

**req.assetFingerprint(label, urlFingerprint, cacheInfo)** - Registers a URL
fingerprint for the specified label.

- `label` - a label identifying the resource
- `urlFingerprint` - the URL fingerprint for the resource. If a request for this
	resource is made, static-asset may add caching headers to the response.
- `cacheInfo` - an Object containing these properties:
	- `lastModified` - the last modified date of the resource
	- `etag` - the ETag of the resource
	- `expires` - the expiration date of the resource; if not given, the resource
		will expire approximately one year in the future. Set to `null` to
		disable strong caching headers.

Other middleware on the stack can generate their own URL fingerprints for
static resources and expose them through `req.assetFingerprint`. Like this:

```javascript
//Suppose we are in a middleware function, designed to uglify JS files...
//stat will refer to the stat Object generated by `fs.stat`
req.assetFingerprint(javascript_filename, javascript_filename + "?v=" +
	stat.mdate.getTime(), {"lastModified": stat.mdate});
```

## Install

`npm install static-asset`

## Default Caching Strategy

static-asset can be fully customized, but it has some basic, reasonably sane default behavior.
By default, static-asset does the following:

## Basic Usage

Usually, this should be good enough to get started.

```javascript
var express = require('express');
var app = express();
var staticAsset = require('static-asset');
app.use(staticAsset(__dirname + "/public/") );
app.use(express.static(__dirname + "/public/") );
//... application code follows (routes, etc.)
```

For example, if you want to include your client-side JavaScript code, simply
do this in your [Jade](https://github.com/visionmedia/jade) or [Blade]
(https://github.com/bminer/node-blade) view:

```jade
script(type="text/javascript", src=assetFingerprint("/client.js") )
```

This will render to something like this:

```html
<script type="text/javascript" src="/client.js?v=1318365481"></script>
```

Notice that static-asset added a URL fingerprint (the UNIX timestamp
1318365481) to the filename.
If you are using the default "cache strategy":
	-In development environments (based on NODE_ENV), the URL fingerprint will
		be updated whenever the file changes
	-In production environments, the URL fingerprints are cached and cannot
		change until the server is restarted.

## Advanced Usage

You can override the "cache strategy" with your own implementation that might
allow you to:

- Upload the asset to Amazon S3 and generate a URL fingerprint that points to S3
- Fly in a spaceship to the moon
- Do something really crazy like generate URL fingerprints that are
Base64-encoded MD5-hashes of the names of random lunar craters.
