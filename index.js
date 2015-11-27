
module.exports = {

	layer: function(backend) {

		var logger = (backend.logger ? backend.logger : console);

		return {
			child: null,
			append: function(layer) {
				this.child = layer;
				return layer;
			},
			set: function(key, value, ttl, cb) {
				backend.set(key, value, ttl, function(err) {
					if(err) {
						cb(err);
					} else {
						if(this.scope.child != null) {
							this.scope.child.set(key, value, ttl, function(err) {
								if(err) {
									cb(err)
								} else {
									cb();
								}
							})
						} else {
							cb();
						}
					}
				}.bind({scope: this}))
			},
			get: function(key, cb) {
				backend.get(key, function(err, value){
					if(err) {
						if(this.scope.child != null) {
							this.scope.child.get(key, function(err, value) {
								cb(err, value);
							})
						} else {
							cb(err);
						}
					} else {
						cb(null, value);
					}
				}.bind({scope: this}))
			},
			delete: function(key, cb) {
				backend.delete(key, function(err) {
					if(this.scope.child != null) {
						this.scope.child.delete(key, function(err) {
							cb();
						})
					} else {
						cb();
					}
				}.bind({scope: this}))
			}
		}
	}
}


// module.exports = function(chain) {
//
// 	var base = {
//
// 		child: null,
//
// 		append: function(item) {
// 			this.child = item;
// 		}
// 	}
//
// 	var chain = null;
//
// 	for(var x = 0; x < chain.length; x++) {
// 		if(chain == null)  {
// 			chain
// 		}
// 		console.log(chain[x]);
// 	}
//
// 	return function(fetch, cb) {
//
// 	}
//
// }
