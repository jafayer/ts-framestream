
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

export enum FrameType {
  CONTROL = 0,
  DATA = 1,
}

/**
 * The escape sequence used to indicate that the next frame is a control frame.
 * 
 * This represents the 4-byte sequence 00 00 00 00.
 */
export const ESCAPE_SEQUENCE = Buffer.from([0, 0, 0, 0]);

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