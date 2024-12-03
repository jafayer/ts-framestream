import { ControlFrameType, ESCAPE_SEQUENCE, FrameType, ControlFieldType } from '../constants';
import net from 'net';

/**
 * An encoder class that handles encoding and sending control frames and data frames.
 *
 * This is the base, underlying class that supports the higher-level Writer class.
 */
export class Encoder {
  /**
   * Upon connecting to the server, the client sends a START control frame.
   *
   * At the start of the byte stream, write the four byte escape sequence 00 00 00 00 that precedes control frames.
   * Write the control frame length as a 32-bit big endian unsigned integer.
   * Write the control frame payload. It must be a START control frame. It may optionally specify a CONTENT_TYPE field.
   *
   * @param port the port to connect over
   * @param address the address to connect to
   * @returns
   */
  async connect(port: number, address: string) {
    return new Promise<net.Socket>((resolve, reject) => {
      const client = net.connect(port, address, () => {
        resolve(client);
      });
      client.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * To receive data, the client waits for the server to send a control frame.
   * @param socket 
   * @returns 
   */
  async recv(socket: net.Socket, timeout?: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const onData = (data: Buffer) => {
        cleanup();
        resolve(data);
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const onClose = () => {
        cleanup();
        reject(new Error('Socket closed before receiving data'));
      };

      const cleanup = () => {
        socket.off('data', onData);
        socket.off('error', onError);
        socket.off('close', onClose);
      };

      socket.once('data', onData);
      socket.once('error', onError);
      socket.once('close', onClose);

      if(timeout) {
        setTimeout(() => {
          cleanup();
          reject(new Error('Timeout while waiting for data'));
        }, timeout);
      }
    });
  }

  /**
   * To send a control frame, an escape sequence (a 4-byte sequence 00 00 00 00) is sent,
   * indicating that a control frame follows.
   *
   * Then, a 32-bit integer is sent, indicating the length of the control frame.
   *
   * Then, the control frame is sent.
   *
   *
   *
   * @param socket
   * @param type
   * @param contentType This field specifies a variable length byte sequence describing the encoding
   * of data frames that appear in the Frame Streams byte stream.
   * Zero, one, or more CONTENT_TYPE fields may appear in READY or ACCEPT control frames.
   * Zero or one CONTENT_TYPE fields may appear in START control frames.
   * No CONTENT_TYPE fields may appear in STOP or FINISH control frames.
   */
  async sendControlFrame(socket: net.Socket, type: ControlFrameType, contentTypes?: string[]): Promise<void> {
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
  }

  /**
   * To send a data frame, send a frame length value greater than zero.
   * The frame length specifies the data frame length, and a data frame follows it.
   *
   * @param socket
   * @param frame
   */
  async sendFrame(socket: net.Socket, frame: Uint8Array) {
    // Send the frame length
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(frame.length, 0);
    socket.write(lengthBuffer);

    // Send the frame
    socket.write(frame);
  }

  static bufferToControlFrameType(buffer: Buffer): ControlFrameType {
    return buffer.readUInt32BE(0);
  }
}

export class Decoder {
  /**
   * Read the first four bytes of the buffer to determine the frame type.
   *
   * If the first four bytes are an escape sequence, the frame is a control frame.
   *
   * Otherwise, the frame is a data frame.
   * @param buffer Buffer containing the frame to check
   * @returns
   */
  async detectFrameType(buffer: Buffer): Promise<FrameType> {
    return new Promise((resolve, reject) => {
      if (buffer.slice(0, 4).equals(ESCAPE_SEQUENCE)) {
        resolve(FrameType.CONTROL);
      } else {
        resolve(FrameType.DATA);
      }
    });
  }
  async readControlFrame(socket: net.Socket): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      socket.on('data', (data) => {
        resolve(data);
      });

      socket.on('error', (err) => {
        reject(err);
      });
    });
  }

  async readFrame(socket: net.Socket): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      socket.on('data', (data) => {
        resolve(data);
      });

      socket.on('error', (err) => {
        reject(err);
      });
    });
  }
}
