describe('Test with authorative backend', function() {

	var fake, cache, LevelSnifer;

	before(function() {
		fake = require('./fake-backend')();
		fake2 = require('./fake-backend')();
		fake3 = require('./fake-backend')();
		cacheChain = require('../index.js');

		cache = cacheChain.chain({
			stale: 10000,
			ttl: 10000 * 2
		});

		LevelSnifer = {};

		var L1 = cacheChain.layer({
			set: function(key, value, options, cb) {
				fake.set(key, value, options.ttl, function(err) {
					cb(err);
				})
			},
			get: function(key, options, cb) {
				fake.get(key, function(err, value) {
					if (!err) {
						LevelSnifer[key] = 'L1';
					}
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
					if (!err) {
						LevelSnifer[key] = 'L2';
					}
					cb(err, value);
				})
			},
			delete: function(key, options, cb) {
				fake2.delete(key, function(err) {
					cb(err);
				})
			}
		});


		var fakeDataset = {
			'key1': {
				v: 'value1'
			},
			'key2': {
				v: 'value2'
			}
		}

		var L3 = cacheChain.layer({
			set: function(key, value, options, cb) {
				cb();
			},
			get: function(key, options, cb) {
				if (fakeDataset[key]) {
					LevelSnifer[key] = 'L3';
					cb(null, fakeDataset[key]);
				} else {
					cb(new Error('Key not found'))
				}
			},
			delete: function(key, options, cb) {
				cb();
			}
		});

		L1.append(L2).append(L3);
		cache.append(L1);

	});

	it('Must find value in lowest (authorative) level', function(done) {
		cache.get('key1', function(err, value) {
			if (err) {
				done('Failed to get value');
			} else {
				if (value == 'value1') {
					if (LevelSnifer['key1'] == 'L3') {
						done();
					} else {
						done('Data retrived from wrong level');
					}
				} else {
					done('Invalid value returned' + value);
				}
			}
		})
	});
})
