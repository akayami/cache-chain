describe('Checking error', function() {

	var cc = require('../index.js');

	it('Must have default ttl and stale values', function(done) {
		var error = new cc.error.notFound(new Error('test'));
		if(error.toString() == 'Error: Key Not Found - Root Error: Error: test') {
			done();
		} else {
			done(new Error('Invalid Error Message'));
		}
	});

	it('Must have default ttl and stale values', function(done) {
		var error = new cc.error.notFound(new Error('test'));
		if(error.toString() == 'Error: Key Not Found - Root Error: Error: test') {
			done();
		} else {
			done(new Error('Invalid Error Message'));
		}
	});

})
