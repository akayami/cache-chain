describe('cache-chain test suite', function() {

	var fake, cache, L1;

	before(function() {
		fake = require('./fake-backend')();
		fake2 = require('./fake-backend')();
		fake3 = require('./fake-backend')();
		cache = require('../index.js');

		L1 = cache.layer({
			set: function(key, value, ttl, cb) {
				fake.set(key, value, ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, cb) {
				fake.get(key, function(err, value) {
					cb(err, value);
				})
			},
			delete: function(key, cb) {
				fake.delete(key, function(err) {
					cb(err);
				})
			}
		});

		var L2 = cache.layer({
			set: function(key, value, ttl, cb) {
				fake2.set(key, value, ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, cb) {
				fake2.get(key, function(err, value) {
					cb(err, value);
				})
			},
			delete: function(key, cb) {
				fake2.delete(key, function(err) {
					cb(err);
				})
			}
		});

		var L3 = cache.layer({
			set: function(key, value, ttl, cb) {
				fake3.set(key, value, ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, cb) {
				fake3.get(key, function(err, value) {
					cb(err, value);
				})
			},
			delete: function(key, cb) {
				fake3.delete(key, function(err) {
					cb(err);
				})
			}
		});

		L1.append(L2).append(L3);

	});

	it('Must be able to set a value', function(done) {
		L1.set('key', 'value', 10000, function(err) {
			if(err) {
				done('Failed to set value');
			} else {
				done();
			}
		})
	});
	it('Must be able to get a value', function(done) {
		L1.get('key', function(err, value) {
			if(err) {
				done('Failed to set value');
			} else {
				if(value == 'value') {
					done();
				} else {
					done('Invalid value returned' + value);
				}
			}
		})
	});
	it('Must be able to delete a value', function(done) {
		L1.delete('key', function(err) {
			if(err) {
				done('Failed to delete value');
			} else {
				L1.get('key', function(err, value) {
					if(err) {
						done()
					} else {
						done('Value returned while it should have been deleted');
					}
				});
			}
		})
	});

	it('Must fail to get non-existing key', function(done) {
		L1.get('non-existing', function(err) {
			if(err) {
				if(err.message == "Key not found") {
					done();
				} else {
					done('Returned error does not match expected error');
				}
			} else {
				done('Failed. no error returned for missing value');
			}
		})
	});
})
