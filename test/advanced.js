var merge = require('merge');
describe('Test with authorative backend', function() {

	var fake, cache, LevelSnifer;

	beforeEach(function() {
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
					LevelSnifer[key] = 'L1';
					// if (!err) {
					// 	LevelSnifer[key] = 'L1';
					// }
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
					LevelSnifer[key] = 'L2';
					// if (!err) {
					// 	LevelSnifer[key] = 'L2';
					// }
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
				LevelSnifer[key] = 'L3';
				if(key == 'failed-lookup-backend-down') {
					cb(new cacheChain.error.failedToRefresh);
				} else if (fakeDataset[key]) {
					cb(null, fakeDataset[key]);
				} else {
					cb(new cacheChain.error.notFound);
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

	it('Second lookup must find the value in top level', function(done) {
		cache.get('key1', function(err, value) {
			if(err) {
				done(err);
			} else {
				setTimeout(function() {
					cache.get('key1', function(err, value) {
						if (value == 'value1') {
							if (LevelSnifer['key1'] == 'L1') {
								done();
							} else {
								done('Data retrived from wrong level' + LevelSnifer['key1']);
							}
						} else {
							done('Invalid value returned' + value);
						}
					});
				}, 15);
			}
		});
	});

	it('Value needs to become stale after stale period has passed', function(done) {
		cache.get('key2', {ttl: 20, stale :10}, function(err, value) {
			if(err) {
				done(err);
			} else {
				setTimeout(function() {
					cache.get('key2', {ttl: 20, stale :10}, function(err, value) {
						if (value == 'value2') {
							if (LevelSnifer['key2'] == 'L1') {
								done();
							} else {
								done('Data retrived from wrong level' + LevelSnifer['key1']);
							}
						} else {
							done('Invalid value returned' + value);
						}
					});
				}, 15);
			}
		});
	});

	it('Value needs to be removed after ttl period has passed', function(done) {
		cache.get('key2', {ttl: 20, stale :10}, function(err, value) {
			if(err) {
				done(err);
			} else {
				setTimeout(function() {
					cache.get('key2', {ttl: 20, stale :10}, function(err, value) {
						if (value == 'value2') {
							if (LevelSnifer['key2'] == 'L3') {
								done();
							} else {
								done('Data retrived from wrong level' + LevelSnifer['key2']);
							}
						} else {
							done('Invalid value returned' + value);
						}
					});
				}, 25);
			}
		});
	});

	it('Must fail to get a non-existing key but cache that failure', function(done) {
		var key = 'non-existing';
		cache.get(key, function(err, value) {
			if (err) {
				if(LevelSnifer[key] == 'L3') {
					if(err instanceof cacheChain.error.notFound) {
						setTimeout(function() {
							cache.get(key, function(err, value) {
								if(err) {
									if(err instanceof cacheChain.error.emptyCacheValue && LevelSnifer[key] == "L1") {
										done();
									} else {
										done('Invalid error message sent');
									}
								} else {
									done('Request on cached get did not return an error');
								}
							});
						}, 100);
					} else {
						done('Returned error does not match expected error');
					}
				} else {
					done('Get failed to reach bottom level: '  + LevelSnifer['key2']);
				}
			} else {
				done('Failed. no error returned for missing value');
			}
		})
	});

	it('Must fail when unable to retrive value from backend (backend down) and should not cache that response', function(done) {
		var key = 'failed-lookup-backend-down';
		cache.get(key, function(err, value) {
			if (err) {
				if(LevelSnifer[key] == 'L3') {
					if(err instanceof cacheChain.error.failedToRefresh) {
						setTimeout(function() {
							cache.get(key, function(err, value) {
								if(err) {
									if((err instanceof cacheChain.error.failedToRefresh) && LevelSnifer[key] == 'L3') {
										done();
									} else {
										done('Invalid error message sent');
									}
								} else {
									done('Request on cached get did not return an error');
								}
							});
						}, 100);
					} else {
						done('Returned error does not match expected error');
					}
				} else {
					done('Get failed to reach bottom level: '  + LevelSnifer['key2']);
				}
			} else {
				done('Failed. no error returned for missing value');
			}
		})
	});

})
