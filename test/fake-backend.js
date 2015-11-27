module.exports = function() {

	function backend() {

		var store = {};

		this.set = function(key, value, ttl, cb) {
			store[key] = {
				v: value,
				timeout: setTimeout(function() {
					delete store[key];
				}, ttl)
			};
			//console.log(store);
			cb();
		};

		this.get = function(key, cb) {
			if (store[key]) {
				cb(null, store[key].v);
			} else {
				cb(new Error('Key not found'));
			}
		};

		this.delete = function(key, cb) {
			clearTimeout(store[key].timeout);
			delete store[key];
			cb();
		}
	}
	return new backend();
};
