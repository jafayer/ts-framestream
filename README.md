# ts-framestream

*Warning: work in progress. Full implementation and unit tests coming soon.*

A lightweight, pure-TypeScript implementation of the [Frame Stream protocol](https://github.com/farsightsec/fstrm).

Other Node.js implementations of the protocol seem to have stopped short of providing full implementations of the handshaking and implementation-specific aspects of the Frame Stream protocol, necessary in building applications compatible with standards such as Dnstap.

This aims to provide all the methods, types, and helpers needed to build protocol-compatible Frame Stream applications.

## Acknowledgements

This implementation was heavily inspired by [golang-framestream](https://github.com/farsightsec/golang-framestream/) and [go-framestream](https://github.com/dmachard/go-framestream).