export type DecodedFrame = {
    size: number,
    payload: Buffer,
}

export class Encoder {
    encode(buf: Buffer): Buffer {
        const len = buf.length;
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32BE(len, 0);
        return Buffer.concat([lenBuf, buf]);
    }

    decode(buf: Buffer): DecodedFrame {
        const size = buf.readUInt32BE(0);
        const payload = buf.subarray(4);
        return { size, payload };
    }
}