# cache-chain
An abstract multilayer cache system.

## Purpose
The main purpose of the system is to build a multipurpose key/value caching or caching/storage system.

## Installation

```
npm install cache-chain
```

## Examples

Very basic example (More [here](https://github.com/akayami/cache-chain-examples)):

In this example, a simple chain of Memory->Redis is setup.

```
var redis = require('redis');
var cc = require('cache-chain');
var ccr = require('cache-chain-redis');
var ccm = require('cache-chain-memory');

var chain = cc.chain({
	ttl: 10000,			// Setting default chain timeouts
	stale: 10000 * 2
});

var redisClient = redis.createClient();
var layerRedis = cc.layer(ccr(redisClient));
var layerMemory = cc.layer(ccm());
layerMemory.append(layerRedis);
chain.append(layerMemory);

var key = "key";
var value = "value";

chain.set(key, value, {ttl: 10, stale: 5}, function(err, reply) {
	if (err) {
		console.error('Error occured');
		console.error(err);
	} else {
		chain.get(key, {ttl: 10, stale: 5}, function(err, reply) {
			if(value === reply) {
				console.log('OK');
			} else {
				console.log('Something happened');
			}
			redisClient.end();
		});
	}
})
```

Please go [here](https://github.com/akayami/cache-chain-examples) for more examples


### Key/Value caching system

The main characteristic of a key/value chained caching system is that the last item in the chain is an authoritative backend that always contains the data. The client makes a request for a key, which is then verified in each cacheing layer until it reaches the bottom layer. The bottom layer resolves the key, and returns the output to upper layer while they update they own storage with correct values.

Consult the following diagram:
[Usecase 1](https://docs.google.com/drawings/d/1nh694sgPjEO1g7CagnQgC61gMwacge9PyaXPGMYSZjk/edit?usp=sharing)

