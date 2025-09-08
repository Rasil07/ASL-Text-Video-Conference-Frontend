/* eslint-disable @typescript-eslint/no-explicit-any */

import { Socket } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import { getSocket, emitWithAck } from "./socket";
import { SOCKET_EVENTS } from "@/config/socket_events";
import { IRoom } from "@/types";

type IUser = {
  userId: string;
  userName: string;
  userEmail: string;
};

type TransportParams = {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
};

export type ProducerSummary = {
  producerId: string;
  kind: "audio" | "video";
  peerId: string;
  peerName: string;
  mediaTag?: string;
};

class SFUClient {
  public socket: Socket;
  private roomId: string;
  private device!: mediasoupClient.types.Device;

  private sendTransport?: mediasoupClient.types.Transport;
  private recvTransport?: mediasoupClient.types.Transport;
  private producers: Map<string, mediasoupClient.types.Producer> = new Map();
  private consumers: Map<string, mediasoupClient.types.Consumer> = new Map();
  private streams: Map<string, MediaStream> = new Map();
  private producerStreams: Map<string, MediaStream> = new Map();

  constructor(roomId: string) {
    this.roomId = roomId;
    this.socket = getSocket();
  }

  public connect() {
    this.socket.connect();
  }

  async joinRoom(
    user: IUser
  ): Promise<{ room: IRoom; producers: ProducerSummary[] } | null> {
    const res = await emitWithAck(SOCKET_EVENTS.ROOM.JOIN, {
      code: this.roomId,
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
    }).catch((err) => {
      console.error("Error joining room:", err);
      return null;
    });

    if (!res) return null;

    const routerCaps = res.routerRtpCapabilities;
    const existingProducers: ProducerSummary[] = res.producers || [];

    this.device = new mediasoupClient.Device();
    await this.device.load({ routerRtpCapabilities: routerCaps });

    // Tell server our RTP caps
    await new Promise<void>((resolve, reject) => {
      this.socket.emit(
        SOCKET_EVENTS.MEDIA.SET_RTP_CAPABILITIES,
        {
          code: this.roomId,
          userId: user.userId,
          rtpCapabilities: this.device.rtpCapabilities,
        },
        (ack: { success: boolean }) => {
          if (ack.success) resolve();
          else reject(new Error("Failed to set RTP caps"));
        }
      );
    });

    return { room: res.room as IRoom, producers: existingProducers };
  }

  async publish(localStream: MediaStream) {
    this.sendTransport ??= await this.createTransport("send");

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const videoProducer = await (
        this.sendTransport as mediasoupClient.types.Transport
      ).produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 150_000, scaleResolutionDownBy: 4 },
          { maxBitrate: 600_000, scaleResolutionDownBy: 2 },
          { maxBitrate: 1_500_000, scaleResolutionDownBy: 1 },
        ],
        appData: { mediaTag: "cam-video" },
      });
      this.producers.set(videoProducer.id, videoProducer);
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const audioProducer = await (
        this.sendTransport as mediasoupClient.types.Transport
      ).produce({
        track: audioTrack,
        appData: { mediaTag: "mic-audio" },
      });
      this.producers.set(audioProducer.id, audioProducer);
    }
  }

  private async createTransport(direction: "send" | "recv") {
    const params = await new Promise<TransportParams>((resolve, reject) => {
      this.socket.emit(
        SOCKET_EVENTS.MEDIA.CREATE_WEBRTC_TRANSPORT,
        { roomId: this.roomId, direction },
        (res: any) => {
          return res?.error
            ? reject(new Error(res.error))
            : resolve(res?.transport as TransportParams);
        }
      );
    });

    const transport =
      direction === "send"
        ? this.device.createSendTransport(params)
        : this.device.createRecvTransport(params);

    transport.on("connect", ({ dtlsParameters }, cb, errback) => {
      this.socket.emit(
        SOCKET_EVENTS.MEDIA.CONNECT_TRANSPORT,
        { code: this.roomId, transportId: transport.id, dtlsParameters },
        (res: any) => {
          res?.error ? errback(new Error(res.error)) : cb();
        }
      );
    });

    if (direction === "send") {
      (transport as mediasoupClient.types.Transport).on(
        "produce",
        ({ kind, rtpParameters, appData }, cb, errback) => {
          this.socket.emit(
            SOCKET_EVENTS.MEDIA.PRODUCE,
            {
              code: this.roomId,
              transportId: transport.id,
              kind,
              rtpParameters,
              appData,
            },
            (res: any) => {
              res?.error ? errback(new Error(res.error)) : cb({ id: res.id });
            }
          );
        }
      );
    }

    return transport;
  }

  private async ensureRecvTransport() {
    this.recvTransport ??= await this.createTransport("recv");
    return this.recvTransport;
  }

  async consume(producer: ProducerSummary) {
    console.log({ producer });
    const transport = await this.ensureRecvTransport();

    const { id, kind, rtpParameters } = await new Promise<any>(
      (resolve, reject) => {
        this.socket.emit(
          SOCKET_EVENTS.MEDIA.CREATE_CONSUMER,
          {
            producerId: producer.producerId,
            transportId: transport.id,
            code: this.roomId,
          },
          (res: any) => {
            return res?.error ? reject(new Error(res.error)) : resolve(res);
          }
        );
      }
    );

    const consumer = await (
      transport as mediasoupClient.types.Transport
    ).consume({
      id,
      producerId: producer.producerId,
      kind,
      rtpParameters,
    });
    this.consumers.set(consumer.id, consumer);

    await new Promise<void>((resolve, reject) => {
      this.socket.emit(
        SOCKET_EVENTS.MEDIA.RESUME_CONSUMER,
        { consumerId: consumer.id, code: this.roomId },
        (res: any) => {
          return res?.error ? reject(new Error(res.error)) : resolve();
        }
      );
    });

    const stream = new MediaStream([consumer.track]);
    this.producerStreams.set(producer.producerId, stream);
    return {
      stream,
      peerId: producer.peerId,
      peerName: producer.peerName,
      kind: producer.kind,
    };
  }

  getStreamByProducerId(producerId: string): MediaStream | undefined {
    return this.producerStreams.get(producerId);
  }

  toggleMic(mute: boolean) {
    for (const p of this.producers.values()) {
      if (p.appData.mediaTag === "mic-audio") {
        mute ? p.pause() : p.resume();
      }
    }
  }

  toggleCam(off: boolean) {
    for (const p of this.producers.values()) {
      if (p.appData.mediaTag === "cam-video") {
        off ? p.pause() : p.resume();
      }
    }
  }

  close() {
    this.producers.forEach((p) => p.close());
    this.consumers.forEach((c) => c.close());
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.socket.disconnect();
    this.producers.clear();
    this.consumers.clear();
    this.producerStreams.clear();
  }
}

export default SFUClient;
