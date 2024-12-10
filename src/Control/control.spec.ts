import { Control, ControlFrameType, ControlFieldType, CONTROL_FRAME_LENGTH_MAX, CONTROL_FIELD_CONTENT_TYPE_LENGTH_MAX } from './index';

describe('Control', () => {
    describe('encode', () => {
        it('should encode a START control frame without content types', () => {
            const buffer = Control.encode(ControlFrameType.START);
            expect(buffer.length).toBe(4);
            expect(buffer.readUInt32BE(0)).toBe(ControlFrameType.START);
        });

        it('should encode a START control frame with content types', () => {
            const contentTypes = ['application/json', 'text/plain'];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            expect(buffer.length).toBeGreaterThan(8);
            expect(buffer.readUInt32BE(0)).toBe(ControlFrameType.START);
        });

        it('should throw an error if content types are provided for STOP control frame', () => {
            expect(() => {
                Control.encode(ControlFrameType.STOP, ['application/json']);
            }).toThrow('CONTENT_TYPE field may not appear in STOP or FINISH control frames');
        });

        it('should encode a START control frame with an empty content type', () => {
            const contentTypes = [''];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            expect(buffer.length).toBeGreaterThan(8);
            expect(buffer.readUInt32BE(0)).toBe(ControlFrameType.START);
        });

        it('should encode a START control frame with a very long content type', () => {
            const contentTypes = ['a'.repeat(CONTROL_FIELD_CONTENT_TYPE_LENGTH_MAX)];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            expect(buffer.length).toBeGreaterThan(8);
            expect(buffer.readUInt32BE(0)).toBe(ControlFrameType.START);
        });

        it('should encode a START control frame with special characters in content types', () => {
            const contentTypes = ['application/json', 'text/plain', 'text/html; charset=UTF-8'];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            expect(buffer.length).toBeGreaterThan(8);
            expect(buffer.readUInt32BE(0)).toBe(ControlFrameType.START);
        });
    });

    describe('decode', () => {
        it('should decode a START control frame without content types', () => {
            const buffer = Control.encode(ControlFrameType.START);
            const decoded = Control.decode(buffer);
            expect(decoded.type).toBe(ControlFrameType.START);
            expect(decoded.contentTypes).toEqual([]);
        });

        it('should decode a START control frame with content types', () => {
            const contentTypes = ['application/json', 'text/plain'];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            const decoded = Control.decode(buffer);
            expect(decoded.type).toBe(ControlFrameType.START);
            expect(decoded.contentTypes).toEqual(contentTypes);
        });

        it('should decode a START control frame with an empty content type', () => {
            const contentTypes = [''];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            const decoded = Control.decode(buffer);
            expect(decoded.type).toBe(ControlFrameType.START);
            expect(decoded.contentTypes).toEqual(contentTypes);
        });

        it('should decode a START control frame with special characters in content types', () => {
            const contentTypes = ['application/json', 'text/plain', 'text/html; charset=UTF-8'];
            const buffer = Control.encode(ControlFrameType.START, contentTypes);
            const decoded = Control.decode(buffer);
            expect(decoded.type).toBe(ControlFrameType.START);
            expect(decoded.contentTypes).toEqual(contentTypes);
        });

        it('should throw an error if control frame length exceeds maximum allowed length', () => {
            const buffer = Buffer.alloc(CONTROL_FRAME_LENGTH_MAX + 5);
            expect(() => {
                Control.decode(buffer);
            }).toThrow(`Control frame length exceeds maximum allowed length: ${CONTROL_FRAME_LENGTH_MAX + 5}`);
        });

        it('should throw an error if control frame type is invalid', () => {
            const buffer = Buffer.alloc(8);
            buffer.writeUInt32BE(999, 0);

            expect(() => {
                Control.decode(buffer);
            }).toThrow('Invalid control frame type: 999');
        });
    });

    describe('checkContentTypes', () => {
        it('should return true if content type is present', () => {
            const control = new Control(['application/json']);
            expect(control.checkContentTypes(['application/json'])).toBe(true);
        });

        it('should return false if content type is not present', () => {
            const control = new Control(['application/json']);
            expect(control.checkContentTypes(['text/plain'])).toBe(false);
        });

        it('should return false if content types are not defined', () => {
            const control = new Control();
            expect(control.checkContentTypes(['application/json'])).toBe(false);
        });
    });

    describe('constructor', () => {
        it('should create an instance with content types', () => {
            const control = new Control(['application/json']);
            expect(control.checkContentTypes(['application/json'])).toBe(true);
        });

        it('should create an instance without content types', () => {
            const control = new Control();
            expect(control.checkContentTypes(['application/json'])).toBe(false);
        });
    });
});