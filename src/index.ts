import { Socket } from 'net';
import { Encoder } from './encoder';
import { ControlFrameType } from './constants';
export {
    ControlFrameType,
    ControlFieldType,
    FrameType,
    ESCAPE_SEQUENCE,
} from "./constants";

export type WriterOpts = {
  socket: Socket;
  encoder: Encoder;
  bidirectional: boolean;
  contentTypes?: string[];
};

export class Writer {
  private socket: Socket;
  private encoder: Encoder;
  private bidirectional: boolean;
  private contentTypes?: string[];

  constructor({ socket, encoder, contentTypes, bidirectional = true }: WriterOpts) {
    this.socket = socket;
    this.encoder = encoder;
    this.bidirectional = bidirectional;
    this.contentTypes = contentTypes;
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
