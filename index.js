'use strict'

var merge = require('merge');

module.exports = {

	error: {
	 	notFound: class extends Error {
			constructor() {
				super('Key Not Found')
			}
		},
	 	failedToRefresh: class extends Error {
			constructor() {
				super('Failed To Refresh')
			}
		}
	},

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

			function aquireLock(key) {
				if(!refreshed[key]) {
					refreshed[key] = setTimeout(function() {
						console.warn('refresh timeout');
						delete refreshed[key];
					}, 3000);
					return true;
				} else {
					return false;
				}
			}

			function clearLock(key) {
				clearTimeout(refreshed[key]);
				delete refreshed[key];
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
					if(value && (value.s * 1 + value.a *  1) < Date.now() && aquireLock(key) ) {
						child.get(key, merge(true, options, {
							deep: true
						}), function(err, value) {
							this.scope.set(key, value.v, {
								ttl: value.t,
								stale: value.s
							}, function(err) {
								if (err) {
									console.log(err);
								}
								clearLock(key);
							});
						}.bind({scope: this.scope}))
					}
				}.bind({scope: this}));
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
				backend.set(key, {
					v: value,
					a: Date.now(),
					s: options.stale,
					t: options.ttl
				}, options, function(err) {
					if (err) {
						cb(err);
					} else {
						if (this.scope.child != null && options && options.shallow && options.shallow !== true) {
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
				if (options.deep === true) {
					if (this.child != null) {
						this.child.get(key, options, function(err, value) {
							//console.log(value);
							cb(err, value);
						})
					} else {
						backend.get(key, options, function(err, value) {
							cb(err, merge(true, {t: options.ttl, s: options.stale, a: Date.now()}, value));
						});
					}
				} else {
					backend.get(key, options, function(err, value) {
						if (err) {
							if (this.scope.child != null) {
								this.scope.child.get(key, options, function(err, value) {
									cb(err, value);
									if(!err) {
										this.scope.set(key, value.v, merge(true, options, {shallow: true}), function(err) {
											if(err) {
												logger.error('Failed to refresh value for key: ' + key);
												logger.error(err);
											}
										});
									} else {
										this.scope.set(key, null, merge(true, options, {shallow: true}), function(err) {
											if(err) {
												logger.error('Failed to refresh value for key: ' + key);
												logger.error(err);
											}
										});
									}
								}.bind({scope: this.scope}));
							} else {
								cb(err);
							}
						} else {
							if(value.v === null) {
								cb(new Error('Empty cached value found'), merge(true, {t: options.ttl, s: options.stale, a: Date.now()}, value));
							} else {
								cb(null, merge(true, {t: options.ttl, s: options.stale, a: Date.now()}, value));
							}
						}
					}.bind({
						scope: this
					}))
				}
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
