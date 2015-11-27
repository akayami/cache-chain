var merge = require('merge');

module.exports = {

	chain: function(config) {
		function Chain(config) {

			var refreshed = {};
			var child;
			this.config = (config ? config : {});
			if (!this.config.stale) {
				if (this.config.ttl) {
					this.config.stale = Math.floor(this.config.ttl / 2);
				} else {
					this.config.stale = 10000;
				}
			}
			if (!this.config.ttl) {
				if (this.config.stale) {
					this.config.ttl = this.config.stale * 2;
				}
			}

			this.set = function(key, value, options, cb) {

				var args = [];
				for (var i = 0; i < arguments.length; i++) {
					args.push(arguments[i]);
				}
				cb = args.pop();
				key = args.shift();
				value = args.shift();
				options = args.shift();
				options = merge(true, this.config, options);

				value = {
					v: value,
					stale: (Date.now + this.config.stale * 1)
				}
				child.set(key, value, options, cb);
			};

			this.get = function(key, options, cb) {

				var args = [];
				for (var i = 0; i < arguments.length; i++) {
					args.push(arguments[i]);
				}

				cb = args.pop();
				key = args.shift();
				options = args.shift();
				options = merge(true, this.config, options);

				child.get(key, options, function(err, value) {
					cb(err, (value && value.v ? value.v : null));
					if (value && value.stale < Date.now) {
						refreshed[key] = setTimeout(function() {
							delete refreshed[key];
						}, 3000)
						child.get(key, {
							refresh: true
						}, function() {

						})
					}
				});
			};

			this.delete = function(key, options, cb) {

				var args = [];
				for (var i = 0; i < arguments.length; i++) {
					args.push(arguments[i]);
				}

				cb = args.pop();
				key = args.shift();
				options = args.shift();
				options = merge(true, this.config, options);

				child.delete(key, options, cb);
			};
			this.append = function(layer) {
				child = layer;
				return layer;
			}
		}
		return new Chain(config);
	},

	layer: function(backend) {

		var logger = (backend.logger ? backend.logger : console);

		return {
			child: null,
			append: function(layer) {
				this.child = layer;
				return layer;
			},
			set: function(key, value, options, cb) {
				backend.set(key, value, options, function(err) {
					if (err) {
						cb(err);
					} else {
						if (this.scope.child != null) {
							this.scope.child.set(key, value, options, function(err) {
								if (err) {
									cb(err)
								} else {
									cb();
								}
							})
						} else {
							cb();
						}
					}
				}.bind({
					scope: this
				}))
			},
			get: function(key, options, cb) {
				backend.get(key, options, function(err, value) {
					if (err) {
						if (this.scope.child != null) {
							this.scope.child.get(key, options, function(err, value) {
								cb(err, value);
							})
						} else {
							cb(err);
						}
					} else {
						cb(null, value);
					}
				}.bind({
					scope: this
				}))
			},
			delete: function(key, options, cb) {
				backend.delete(key, options, function(err) {
					if (this.scope.child != null) {
						this.scope.child.delete(key, options, function(err) {
							cb();
						})
					} else {
						cb();
					}
				}.bind({
					scope: this
				}))
			}
		}
	}
}
