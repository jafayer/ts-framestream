import net, { Socket } from 'net';
import type { NetConnectOpts } from 'net';
import { Control, ControlFrameType } from '../Control';
import { Encoder } from '../encoder/Encoder';

/**
 * Implements the interface necessary to be an abstract writer.
 *
 * This interface is agnostic to the actual medium used for communication.
 * For example, a writer that satisifies this interface could communicate over
 * a socket, a file descriptor, a web socket, etc.
 *
 * The writer is responsible for encoding and writing frames to the communication medium.
 */
export interface Writer {
  /**
   * A boolean indicating if the writer should communicate in bidirectional mode.
   */
  bidirectional: boolean;

  /**
   * An optional array of content types that the writer supports.
   */
  contentTypes?: string[];

  /** An optional timeout parameter, in ms. This is optional because not all
   * communication mediums require or support timeouts.
   */
  timeout?: number;

  /** Module responsible for handling decoding/encoding framing of packets. */
  encoder: Encoder;

  /** Module responsible for handing decoding/encoding control packets */
  control: Control;

  /** The primary method to write a Frame Stream frame to the communication medium. */
  writeFrame: (frame: Buffer) => Promise<Error | void>;

  /** A method to receive a frame from the communication medium. */
  recv?: () => Promise<Buffer>;

  /** Implements the basic handshake for bidirectional mode communication */
  handshake(): Promise<Error | void>;
}

export type SocketWriterOpts = {
  socket: Socket;
  timeout?: number;
  bidirectional: boolean;
  contentTypes?: string[];
  control: Control;
  encoder: Encoder;
};

export type SocketWriterConnectionOpts = Omit<SocketWriterOpts, 'socket'> & {
  connectionOpts: NetConnectOpts;
};

export class SocketWriter implements Writer {
  private socket: Socket;
  public timeout?: number;
  public bidirectional: boolean;
  public contentTypes?: string[];
  public control: Control;
  public encoder: Encoder;

  constructor({
    socket,
    timeout,
    bidirectional = true,
    contentTypes,
    control = new Control(contentTypes),
    encoder = new Encoder(),
  }: SocketWriterOpts) {
    this.socket = socket;
    this.timeout = timeout;
    this.bidirectional = bidirectional;
    this.contentTypes = contentTypes;
    this.control = control;
    this.encoder = encoder;
  }

  async writeFrame(frame: Buffer): Promise<Error | void> {
    return new Promise((resolve, reject) => {
      this.socket.write(this.encoder.encode(frame), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async recv(timeout?: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if(timeout !== undefined) {
        setTimeout(() => {
          reject(new Error('Communication timed out'));
        })
      }
      
      this.socket.once('data', (data) => {
        resolve(data);
      });
    });
  }

  async handshake(): Promise<Error | void> {
    // Send READY control frame with content types from control internal state
    await this.writeFrame(this.control.encode(ControlFrameType.READY));

    // Wait for ACCEPT control frame
    const acceptFrame = await this.recv(5000);
    const { type, contentTypes } = this.control.decode(acceptFrame);
    if (type !== ControlFrameType.ACCEPT) {
      throw new Error(`Expected ACCEPT control frame, got ${type}`);
    }
    if(contentTypes && !this.control.checkContentTypes(contentTypes)) {
      throw new Error('Content types not supported');
    }

  }

  static async fromEndpoint({
    connectionOpts,
    timeout,
    bidirectional = true,
    contentTypes,
    encoder,
    control,
  }: SocketWriterConnectionOpts): Promise<SocketWriter> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      socket.connect(connectionOpts, () => {
        resolve(new SocketWriter({ socket, timeout, bidirectional, encoder: encoder || new Encoder(), control: control || new Control(contentTypes) }));
      });
      socket.on('error', (err) => {
        reject(err);
      });
    });
  }
}
