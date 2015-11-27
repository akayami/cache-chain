describe('cache-chain test suite', function() {

	var fake, cache;

	before(function() {
		fake = require('./fake-backend')();
		fake2 = require('./fake-backend')();
		fake3 = require('./fake-backend')();
		cacheChain = require('../index.js');

		cache = cacheChain.chain({
			stale: 10000,
			ttl: 10000 * 2
		});

		var L1 = cacheChain.layer({
			set: function(key, value, options, cb) {
				fake.set(key, value, options.ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, options, cb) {
				fake.get(key, function(err, value) {
					cb(err, value);
				})
			},
			delete: function(key, options, cb) {
				fake.delete(key, function(err) {
					cb(err);
				})
			}
		});

		var L2 = cacheChain.layer({
			set: function(key, value, options, cb) {
				fake2.set(key, value, options.ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, options, cb) {
				fake2.get(key, function(err, value) {
					cb(err, value);
				})
			},
			delete: function(key, options, cb) {
				fake2.delete(key, function(err) {
					cb(err);
				})
			}
		});

		var L3 = cacheChain.layer({
			set: function(key, value, options, cb) {
				fake3.set(key, value, options.ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, options, cb) {
				fake3.get(key, function(err, value) {
					cb(err, value);
				})
			},
			delete: function(key, options, cb) {
				fake3.delete(key, function(err) {
					cb(err);
				})
			}
		});

		L1.append(L2);//.append(L3);
		cache.append(L1);

	});

	it('Must have default ttl and stale values', function(done) {
		var p = cacheChain.chain();
		if(p.config.stale == 10000 && p.config.ttl == 20000) {
			done()
		} else {
			done('Default values are not set');
		}
	});

	it('Must respect stale setting', function(done) {
		var stale = 53554;
		var p = cacheChain.chain({
			stale: stale
		});
		if(p.config.stale == stale) {
			done();
		} else {
			done('Config set improperly');
		}
	});

	it('Must derive ttl setting from stale setting', function(done) {
		var stale = 53554;
		var p = cacheChain.chain({
			stale: stale
		});
		if(p.config.ttl == stale * 2) {
			done();
		} else {
			done('TTL derived improperly');
		}
	});

	it('Must respect ttl setting', function(done) {
		var ttl = 53554;
		var p = cacheChain.chain({
			ttl: ttl
		});
		if(p.config.ttl == ttl) {
			done();
		} else {
			done('Config set improperly');
		}
	});

	it('Must derive stale setting from ttl setting', function(done) {
		var ttl = 53554;
		var p = cacheChain.chain({
			ttl: ttl
		});
		if(p.config.stale == ttl / 2) {
			done();
		} else {
			done('Config set improperly');
		}
	});

	it('Must be able to set a value', function(done) {
		cache.set('key', 'value', { ttl: 10000 }, function(err) {
			if (err) {
				done('Failed to set value');
			} else {
				done();
			}
		})
	});
	it('Must be able to get a value', function(done) {
		cache.get('key', function(err, value) {
			if (err) {
				done('Failed to set value');
			} else {
				if (value == 'value') {
					done();
				} else {
					done('Invalid value returned' + value);
				}
			}
		})
	});
	it('Must be able to delete a value', function(done) {
		cache.delete('key', function(err) {
			if (err) {
				done('Failed to delete value');
			} else {
				cache.get('key', function(err, value) {
					if (err) {
						done()
					} else {
						done('Value returned while it should have been deleted');
					}
				});
			}
		})
	});

	it('Must fail to get non-existing key', function(done) {
		cache.get('non-existing', function(err) {
			if (err) {
				if (err.message == "Key not found") {
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
