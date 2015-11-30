# cache-chain
An abstract multilayer cache system.

## Purpose
The main purpose of the system is to build a multipurpose key/value caching or caching/storage system.

### Key/Value caching system

The main characteristic of a key/value chained caching system is that the last item in the chain is an authoritative backend that always contains the data. The client makes a request for a key, which is then verified in each cacheing layer until it reaches the bottom layer. The bottom layer resolves the key, and returns the output to upper layer while they update they own storage with correct values.

Consult the following diagram:
[Usecase 1](https://docs.google.com/drawings/d/1nh694sgPjEO1g7CagnQgC61gMwacge9PyaXPGMYSZjk/edit?usp=sharing)

