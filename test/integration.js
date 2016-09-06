module.exports = function(di) {

	describe('Common Integration Tests', function() {
		it('It needs to set a value', function(done) {
			var key = 'key';
			var value = 'value';
			di.chain.set(key, value, function(err, reply) {
				if (err) {
					done(err);
				} else {
					di.chain.get(key, function(err, reply) {
						if (reply === value) {
							done();
						} else {
							done(err);
						}
					});
				}
			})
		});

		it('It needs to retrive a set value', function(done) {
			var key = 'key';
			var value = 'value';
			di.chain.set(key, value, function(err, reply) {
				if (err) {
					done(err);
				} else {
					di.chain.get(key, function(err, reply) {
						if (err) {
							done(err);
						} else {
							if (reply == value) {
								done();
							} else {
								done(reply)
							}
						}
					})
				}
			})
		});

		it('It needs to delete a set value', function(done) {
			var key = 'key';
			var value = 'value';
			di.chain.set(key, value, function(err, reply) {
				if (err) {
					done(err);
				} else {
					di.chain.delete(key, function(err) {
						if (err) {
							cb(err);
						} else {
							di.chain.get(key, function(err, reply) {
								if (err) {
									if (err instanceof di.cc.error.notFound) {
										done();
									} else {
										done('Wrong error message returned');
									}
								} else {
									done('Expected error message. Got correct reply instead')
								}
							})
						}
					})
				}
			})
		});

		it('A value needs to timeout', function(done) {
			var key = 'key';
			var value = 'value';
			di.chain.set(key, value, {
				ttl: 10,
				stale: 5
			}, function(err, reply) {
				if (err) {
					done(err);
				} else {
					setTimeout(function() {
						di.chain.get(key, function(err, reply) {
							if (err) {
								if (err instanceof di.cc.error.notFound) {
									done();
								} else {
									done('Wrong error message returned');
								}
							} else {
								done('Expected error message. Got correct reply instead')
							}
						})
					}, 15);
				}
			})
		});
	})
};
