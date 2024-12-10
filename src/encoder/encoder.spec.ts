import { Encoder, DecodedFrame } from './Encoder';

describe('Encoder', () => {
    let encoder: Encoder;

    beforeEach(() => {
        encoder = new Encoder();
    });

    describe('encode', () => {
        it('should encode a buffer with its length prepended', () => {
            const buf = Buffer.from('test');
            const encoded = encoder.encode(buf);
            expect(encoded.length).toBe(buf.length + 4);
            expect(encoded.readUInt32BE(0)).toBe(buf.length);
            expect(encoded.slice(4).equals(buf)).toBe(true);
        });

        it('should encode an empty buffer', () => {
            const buf = Buffer.alloc(0);
            const encoded = encoder.encode(buf);
            expect(encoded.length).toBe(4);
            expect(encoded.readUInt32BE(0)).toBe(0);
        });
    });

    describe('decode', () => {
        it('should decode a buffer with its length prepended', () => {
            const buf = Buffer.from('test');
            const encoded = encoder.encode(buf);
            const decoded: DecodedFrame = encoder.decode(encoded);
            expect(decoded.size).toBe(buf.length);
            expect(decoded.payload.equals(buf)).toBe(true);
        });

        it('should decode an empty buffer', () => {
            const buf = Buffer.alloc(0);
            const encoded = encoder.encode(buf);
            const decoded: DecodedFrame = encoder.decode(encoded);
            expect(decoded.size).toBe(0);
            expect(decoded.payload.length).toBe(0);
        });

        it('should throw an error if buffer length is less than 4', () => {
            const buf = Buffer.alloc(3);
            expect(() => {
                encoder.decode(buf);
            }).toThrow();
        });
    });
});