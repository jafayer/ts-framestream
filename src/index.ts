import net from 'net';
import { Encoder } from './encoder';
import { ControlFrameType } from './constants';
export { ControlFrameType, ControlFieldType, FrameType, ESCAPE_SEQUENCE } from './constants';

export type WriterOpts = {
  socket: net.Socket;
  encoder?: Encoder;
  bidirectional?: boolean;
  contentTypes?: string[];
};

export type ConnectionOpts = Omit<WriterOpts, 'socket'> & {
  host: string;
  port: number;
};

export class Writer {
  private socket: net.Socket;
  private encoder: Encoder;
  private bidirectional: boolean;
  private contentTypes?: string[];

  constructor({ socket, encoder = new Encoder(), contentTypes, bidirectional = true }: WriterOpts) {
    this.socket = socket;
    this.encoder = encoder;
    this.bidirectional = bidirectional;
    this.contentTypes = contentTypes;
  }

  /**
   * Connect to a server on a given endpoint and return a Writer instance.
   */
  static async FromEndpoint({
    host,
    port,
    contentTypes,
    bidirectional = true,
    encoder = new Encoder(),
  }: ConnectionOpts): Promise<Writer> {
    const socket = await encoder.connect(port, host);
    const writer = new Writer({ socket, encoder, contentTypes, bidirectional });
    await writer.init();
    return writer;
  }

  async init() {
    if (this.bidirectional) {
      // Send READY control frame
      await this.encoder.sendControlFrame(this.socket, ControlFrameType.READY, this.contentTypes);
      // Wait for ACCEPT control frame
      const resp = await this.encoder.recv(this.socket, 5000);
      const respType = Encoder.bufferToControlFrameType(resp);
      if (respType !== ControlFrameType.ACCEPT) {
        throw new Error(`Expected ACCEPT control frame, got ${respType}`);
      }
    }

    // Send START control frame
    await this.encoder.sendControlFrame(this.socket, ControlFrameType.START, this.contentTypes);
  }
}
