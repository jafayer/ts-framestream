/**
 * Enum for the different types of control frames senders and receivers
 * can exchange.
 *
 * In a unidirectional connection, the typical sequence of control frames is:
 *
 * 1. The client/sender sends a START control frame to initiate a connection.
 * 2. The client/sender sends one or more data frames.
 * 3. The client/sender sends a STOP control frame to terminate the connection.
 *
 * In a bidirectional connection, the typical sequence of control frames is:
 * 1. The client/sender sends a READY control frame to indicate it is ready to start the connection.
 * 2. The server/receiver sends an ACCEPT control frame to indicate it is ready to proceed.
 * 3. The client/sender sends a START control frame to initiate a connection.
 * 4. The client/sender sends one or more data frames.
 * 5. The client/sender sends a STOP control frame to terminate the connection.
 * 6. The server/receiver sends a FINISH control frame to indicate it is ending the session.
 */
export enum ControlFrameType {
  /** Sent by a server/receiver after receiving a START to indicate it is ready to proceed. */
  ACCEPT = 0x01,
  /** Sent by a client/sender to initiate a connection. */
  START = 0x02,
  /** Sent by a client/sender to terminate a connection. */
  STOP = 0x03,
  /** Sent by a client/sender to indicate it is ready to send data. */
  READY = 0x04,
  /** Sent by a client/sender to indicate it is ending the session. */
  FINISH = 0x05,
}

/**
 * The escape sequence used to indicate that the next frame is a control frame.
 * 
 * This represents the 4-byte sequence 00 00 00 00.
 */
export const ESCAPE_SEQUENCE = Buffer.from([0, 0, 0, 0]);

/**
 * Enum for the different types of control frame fields.
 *
 * These are sent within the control frame to delimit frames within the payload.
 *
 * For example, the "Content Type" field is written as a big-endian uint32 before
 * each content type in the control frame (if present).
 */
export enum ControlFieldType {
  /** Control frame field type value for the "Content Type" control frame option. */
  CONTENT_TYPE = 0x01,
}

/**
 * The maximum length in bytes of an "Accept", "Start", or "Stop" control frame payload.
 * This excludes the escape sequence and the control frame length.
 */
export const CONTROL_FRAME_LENGTH_MAX = 512;

/**
 * The maximum length in bytes of a "Content Type" control frame field payload.
 * This excludes the field type and payload length
 */
export const CONTROL_FIELD_CONTENT_TYPE_LENGTH_MAX = 512;


export type DecodedControlFrame = {
    type: ControlFrameType,
    contentTypes?: string[],
}

/**
 * Class responsible for implementing encoding/parsing the control frames
 */
export class Control {

    constructor(
        private contentTypes?: string[]
    ) {}

    static encode(type: ControlFrameType, contentTypes?: string[]): Buffer {
        // Check if the content type is valid
        if (contentTypes && (type === ControlFrameType.STOP || type === ControlFrameType.FINISH)) {
            throw new Error('CONTENT_TYPE field may not appear in STOP or FINISH control frames');
        }

        // Create an array to hold the buffers
        const buffers: Buffer[] = [];

        // Write the control frame type to the buffer
        const typeBuffer = Buffer.alloc(4);
        typeBuffer.writeUInt32BE(type, 0);
        buffers.push(typeBuffer);

        if (contentTypes) {
            for (const contentType of contentTypes) {
                // Write the control field type to the buffer
                const controlFieldBuffer = Buffer.alloc(4);
                controlFieldBuffer.writeUInt32BE(ControlFieldType.CONTENT_TYPE, 0);
                buffers.push(controlFieldBuffer);

                // Write the length of the content type to the buffer
                const lengthBuffer = Buffer.alloc(4);
                lengthBuffer.writeUInt32BE(Buffer.byteLength(contentType), 0);
                buffers.push(lengthBuffer);

                // Write the content type to the buffer
                const contentTypeBuffer = Buffer.from(contentType);
                buffers.push(contentTypeBuffer);
            }
        }
        
        return Buffer.concat(buffers);
    }

    static decode(buffer: Buffer): DecodedControlFrame {
        if(buffer.length < 4) {
            throw new Error('Control frame length is less than 4 bytes');
        }

        const cfData = buffer.subarray(4);
        if(cfData.length > CONTROL_FRAME_LENGTH_MAX) {
            throw new Error(`Control frame length exceeds maximum allowed length: ${buffer.length}`);
        }

        const controlFrameType = buffer.subarray(0, 4).readUInt32BE(0);
        if(!Object.values(ControlFrameType).includes(controlFrameType)) {
            throw new Error(`Invalid control frame type: ${controlFrameType}`);
        }

        const contentTypes: string[] = [];
        const contentTypesBuffer = buffer.subarray(4);

        if(contentTypesBuffer.length > 0) {
            let offset = 0;
            while(offset < contentTypesBuffer.length) {
                const fieldType = contentTypesBuffer.subarray(offset, offset + 4).readUInt32BE(0);
                if(fieldType !== ControlFieldType.CONTENT_TYPE) {
                    throw new Error(`Invalid control field type: ${fieldType}`);
                }
                offset += 4;

                const length = contentTypesBuffer.subarray(offset, offset + 4).readUInt32BE(0);
                if(length > CONTROL_FIELD_CONTENT_TYPE_LENGTH_MAX) {
                    throw new Error(`Control field length exceeds maximum allowed length: ${length}`);
                }
                offset += 4;

                const contentType = contentTypesBuffer.subarray(offset, offset + length).toString();
                contentTypes.push(contentType);
                offset += length;
            }
        }

        return {
            type: controlFrameType,
            contentTypes,
        };
    }

    checkContentTypes(contentType: string[]): boolean {
        if(!this.contentTypes) {
            return false;
        }

        return this.contentTypes.some((ct) => contentType.includes(ct));
    }


    encode(type: ControlFrameType): Buffer {
        return Control.encode(type, this.contentTypes);
    }

    decode(buffer: Buffer): DecodedControlFrame {
        return Control.decode(buffer);
    }
}

/**
 * async writeControlFrame(socket: net.Socket, type: ControlFrameType, contentTypes?: string[]): Promise<void> {
    // Check if the content type is valid
    if (contentTypes && (type === ControlFrameType.STOP || type === ControlFrameType.FINISH)) {
      throw new Error('CONTENT_TYPE field may not appear in STOP or FINISH control frames');
    }

    // Create an array to hold the buffers
    const buffers: Buffer[] = [];

    // Write the control frame type to the buffer
    const typeBuffer = Buffer.alloc(4);
    typeBuffer.writeUInt32BE(type, 0);
    buffers.push(typeBuffer);

    if (contentTypes) {
      for (const contentType of contentTypes) {
        // Write the control field type to the buffer
        const controlFieldBuffer = Buffer.alloc(4);
        controlFieldBuffer.writeUInt32BE(ControlFieldType.CONTENT_TYPE, 0);
        buffers.push(controlFieldBuffer);

        // Write the length of the content type to the buffer
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(Buffer.byteLength(contentType), 0);
        buffers.push(lengthBuffer);

        // Write the content type to the buffer
        const contentTypeBuffer = Buffer.from(contentType);
        buffers.push(contentTypeBuffer);
      }
    }

    // Send escape sequence
    socket.write(ESCAPE_SEQUENCE);

    // Concatenate all buffers and write to the socket
    const finalBuffer = Buffer.concat(buffers);

    // write the length of the control frame to the buffer
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(finalBuffer.length, 0);
    socket.write(lengthBuffer);

    // write the control frame to the buffer
    socket.write(finalBuffer);
 */