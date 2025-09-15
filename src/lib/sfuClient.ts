/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Socket } from "socket.io-client";
import { Device as MediasoupDevice } from "mediasoup-client";
import {
  Transport,
  Producer,
  Consumer,
  RtpCapabilities,
} from "mediasoup-client";
import { getSocket } from "./socket";
import { SOCKET_EVENTS } from "@/config/socket_events";

export type ID = string;

export type Role = "host" | "cohost" | "speaker" | "viewer";

export interface DeviceInfo {
  os: string;
  browser: string;
  version?: string;
  isMobile?: boolean;
}

export interface JoinResponse {
  peers: Array<{ peerId: ID; userId: ID; role: Role }>;
  rtpCapabilities: any; // mediasoup types are dynamic, keep as any
}

export interface TransportParams {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
}

export type MediaKind = "audio" | "video";

export interface NewProducerEvent {
  peerId: ID;
  producerId: ID;
  kind: MediaKind;
  userName?: string;
  userEmail?: string;
  userId?: ID;
}

export interface PeerSummary {
  peerId: ID;
  userId: ID;
  role: Role;
}

export type SFUClientEvents = {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onPeerJoined?: (peer: PeerSummary) => void;
  onPeerLeft?: (peerId: ID) => void;
  onNewRemoteTrack?: (opts: {
    peerId: ID;
    kind: MediaKind;
    track: MediaStreamTrack;
    stream: MediaStream;
    producerId: ID;
    consumerId: ID;
    userName?: string;
    userEmail?: string;
  }) => void;
  onRemoteTrackClosed?: (producerId: ID) => void;
  onError?: (err: Error | string) => void;
};

export class SFUClient {
  private socket!: Socket;
  private device!: MediasoupDevice;
  private roomId!: ID;
  private userId!: ID;
  private role!: string;
  private sendTransport?: Transport;
  private recvTransport?: Transport;
  private localStream?: MediaStream;
  private producers = new Map<ID, Producer>();
  private consumers = new Map<ID, Consumer>();
  private events: SFUClientEvents;

  private selfPeerId?: ID;

  private consumedProducerIds = new Set<ID>();
  // optional: if you want fast removal by producerId later
  private producerToConsumer = new Map<ID, ID>();
  private peerToProducerIds = new Map<ID, Set<ID>>();

  constructor(events: SFUClientEvents = {}) {
    this.events = events;
  }

  private waitForSocketConnected(): Promise<void> {
    if (this.socket?.connected && this.socket.id) {
      this.selfPeerId = this.socket.id;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const onConnect = () => {
        this.selfPeerId = this.socket.id; // <-- set it here
        this.socket.off("connect", onConnect);
        resolve();
        this.events.onConnected?.();
      };
      this.socket.on("connect", onConnect);
    });
  }

  get isConnected() {
    return Boolean(this.socket && this.socket.connected);
  }
  getLocalStream() {
    return this.localStream;
  }

  async connect() {
    this.socket = getSocket();

    await this.waitForSocketConnected();

    this.socket.on("connect", () => {
      this.selfPeerId = this.socket.id;
      this.events.onConnected?.();
    });
    this.socket.on("disconnect", () => this.events.onDisconnected?.());

    this.selfPeerId = this.socket.id;
    // peers lifecycle
    this.socket.on(SOCKET_EVENTS.ROOM.ON.PEER_JOINED, (peer) =>
      this.events.onPeerJoined?.(peer)
    );
    // 1) peer left (bulk)
    this.socket.on(
      SOCKET_EVENTS.ROOM.ON.PEER_LEFT,
      ({ peerId, producerIds }) => {
        if (Array.isArray(producerIds)) {
          for (const pid of producerIds) this.closeRemoteByProducerId(pid);
        } else {
          // fallback: clean by map if server didn’t send producerIds
          this.removePeer(peerId);
        }
        this.events.onPeerLeft?.(peerId);
      }
    );

    // 2) single producer closed (mute/stop/etc.)
    this.socket.on(
      SOCKET_EVENTS.ROOM.ON.PRODUCER_CLOSED,
      ({ producerId, peerId }) => {
        this.closeRemoteByProducerId(producerId);
        // optional: if that was the last producer of the peer, you may remove the card entirely
        const set = this.peerToProducerIds.get(peerId);
        if (set) {
          set.delete(producerId);
          if (set.size === 0) {
            this.peerToProducerIds.delete(peerId);
            this.events.onPeerLeft?.(peerId);
          }
        }
      }
    );

    this.socket.on(SOCKET_EVENTS.ROOM.ON.NEW_PRODUCER, (evt) => {
      this.handleNewProducer(evt[0]).catch(console.error);
    });
  }

  private closeRemoteByProducerId = (producerId: ID) => {
    const consumerId = this.producerToConsumer.get(producerId);
    if (!consumerId) return;

    this.producerToConsumer.delete(producerId);
    this.consumedProducerIds.delete(producerId);

    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      try {
        consumer.close();
      } catch {}
      this.consumers.delete(consumerId);
    }

    // tell your UI to remove the media element for this producerId
    this.events.onRemoteTrackClosed?.(producerId);
  };

  private removePeer = (peerId: ID) => {
    const set = this.peerToProducerIds.get(peerId);
    if (set) {
      for (const producerId of set) this.closeRemoteByProducerId(producerId);
      this.peerToProducerIds.delete(peerId);
    }
  };

  // ---------------
  // helpers
  // ---------------

  private async ensureRecvTransport() {
    if (this.recvTransport) return;
    const response: { params: TransportParams; success: boolean } =
      await this.emitAsync(SOCKET_EVENTS.MEDIA.CREATE_WEBRTC_TRANSPORT, {
        code: this.roomId,
        direction: "recv",
      });

    this.recvTransport = this.device.createRecvTransport(response.params);

    this.recvTransport.on("connect", async ({ dtlsParameters }, cb, errb) => {
      try {
        await this.emitAsync(SOCKET_EVENTS.MEDIA.CONNECT_TRANSPORT, {
          code: this.roomId,
          transportId: this.recvTransport!.id,
          dtlsParameters,
        });
        cb();
      } catch (e) {
        errb(e as any);
      }
    });

    this.recvTransport.on("connectionstatechange", (state) => {
      if (state === "failed" || state === "closed") {
        this.events.onError?.(new Error("recv transport state: " + state));
      }
    });
  }

  private async handleNewProducer({
    peerId,
    producerId,
    kind,
    userName,
    userEmail,
    userId,
  }: NewProducerEvent) {
    try {
      if (this.selfPeerId == peerId) return;

      if (!this.device) return;

      // de-dupe: avoid duplicate a=mid errors
      // ⇣⇣⇣ lock BEFORE any await
      if (this.consumedProducerIds.has(producerId)) return;
      this.consumedProducerIds.add(producerId);

      await this.ensureRecvTransport();

      const response = await this.emitWithAck<{
        params: any;
        success: boolean;
      }>(SOCKET_EVENTS.MEDIA.CONSUME, {
        code: this.roomId,
        rtpCapabilities: this.device.rtpCapabilities,
        producerId,
        consumerTransportId: this.recvTransport!.id,
      });

      const consumer: Consumer = await this.recvTransport!.consume({
        id: response.params.id,
        producerId: response.params.producerId,
        kind: response.params.kind,
        rtpParameters: response.params.rtpParameters,
      });
      this.consumers.set(consumer.id as ID, consumer);
      this.producerToConsumer.set(producerId, consumer.id as ID);

      this.consumedProducerIds.add(producerId);

      // track maps
      let set = this.peerToProducerIds.get(peerId);
      if (!set) this.peerToProducerIds.set(peerId, (set = new Set()));
      set.add(producerId);
      // mediasoup gives us a track; attach it to a MediaStream for React video element

      // auto-clean if server closes producer/transport
      const closeByProducer = () => this.closeRemoteByProducerId(producerId);
      consumer.on("producerclose", closeByProducer);
      consumer.on("transportclose", closeByProducer);

      //   // (optional but recommended)
      // await this.emitAsync(SOCKET_EVENTS.MEDIA.RE, {
      //   code: this.roomId,
      //   consumerId: consumer.id,
      // });

      const stream = new MediaStream([consumer.track]);

      this.events.onNewRemoteTrack?.({
        peerId,
        kind,
        track: consumer.track,
        stream,
        producerId,
        consumerId: consumer.id as ID,
        userName,
        userEmail,
      });
    } catch (e) {
      //   this.consumedProducerIds.delete(producerId);
    }
  }
  private emitWithAck<T = any>(
    event: string,
    payload?: any,
    timeoutMs = 8000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const s = this.socket;
      let done = false;

      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          reject(new Error(`Ack timed out for ${event}`));
        }
      }, timeoutMs);

      s.emit(event, payload ?? {}, (resp: any) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (resp?.error) reject(resp.error);
        else resolve(resp as T);
      });
    });
  }
  private emitAsync<T = any>(event: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.socket.emit(event, payload, (res: any) => {
        if (!res || res.error)
          return reject(new Error(res?.error || "emit failed: " + event));
        resolve(res);
      });
    });
  }
  async join(roomCode: ID, deviceInfo?: DeviceInfo) {
    this.roomId = roomCode;
    const localRtpCapabilities: RtpCapabilities | undefined = undefined; // device will supply
    const response: JoinResponse = await this.emitWithAck(
      SOCKET_EVENTS.ROOM.JOIN,
      {
        code: roomCode,
        device: deviceInfo,
        rtpCapabilities: localRtpCapabilities,
      }
    );

    this.device = new MediasoupDevice();
    await this.device.load({
      routerRtpCapabilities: response.rtpCapabilities,
    });

    if (this.device.loaded) {
      const setRtpRes = await this.emitAsync(
        SOCKET_EVENTS.MEDIA.SET_RTP_CAPABILITIES,
        {
          code: this.roomId,
          rtpCapabilities: this.device.rtpCapabilities,
        }
      ).catch((err) => {
        console.error("Failed to set RTP capabilities on server:", err);
      });
    }

    await this.ensureRecvTransport();

    try {
      const producerLists = await this.emitAsync(
        SOCKET_EVENTS.ROOM.GET_PRODUCERS,
        { code: this.roomId }
      );

      for (const p of producerLists.producers) {
        await this.handleNewProducer(p);
      }
    } catch (err) {
      console.error("Error getting existing producers:", err);
    }
  }

  async enableCameraAndMic(
    constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: true,
    }
  ) {
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.localStream;
  }

  async startProducing(simulcast = true) {
    if (!this.localStream) throw new Error("No local stream to produce");

    // ensure send transport exists
    if (!this.sendTransport) await this.createSendTransport();
    const videoTrack = this.localStream.getVideoTracks()[0];
    const audioTrack = this.localStream.getAudioTracks()[0];

    if (videoTrack) {
      const encodings = simulcast
        ? [
            { maxBitrate: 150_000, scaleResolutionDownBy: 4, rid: "q" },
            { maxBitrate: 400_000, scaleResolutionDownBy: 2, rid: "h" },
            { maxBitrate: 1_200_000, scaleResolutionDownBy: 1, rid: "f" },
          ]
        : undefined;

      const vp8PreferredParams: any =
        this.device && (this.device as any).handlerName?.includes("Safari")
          ? {}
          : {};

      const producer = await this.sendTransport!.produce({
        track: videoTrack,
        appData: { mediaTag: "cam" },
        encodings,
        codecOptions: vp8PreferredParams,
      });
      this.producers.set(producer.id as ID, producer);
    }

    if (audioTrack) {
      const producer = await this.sendTransport!.produce({
        track: audioTrack,
        appData: { mediaTag: "mic" },
      });
      this.producers.set(producer.id as ID, producer);
    }
  }

  private async createSendTransport() {
    const response: { params: TransportParams; success: boolean } =
      await this.emitWithAck(SOCKET_EVENTS.MEDIA.CREATE_WEBRTC_TRANSPORT, {
        code: this.roomId,
        direction: "send",
      });

    this.sendTransport = this.device.createSendTransport(response.params);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          const connectTransportRes = await this.emitAsync(
            SOCKET_EVENTS.MEDIA.CONNECT_TRANSPORT,
            {
              code: this.roomId,
              transportId: this.sendTransport?.id,
              dtlsParameters,
            }
          );

          callback();
        } catch (error) {
          errback(error as Error);
        }
      }
    );

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, cb, errb) => {
        try {
          const { producerId } = await this.emitAsync(
            SOCKET_EVENTS.MEDIA.PRODUCE,
            {
              code: this.roomId,
              transportId: this.sendTransport!.id,
              kind,
              rtpParameters,
              appData,
            }
          );
          cb({ id: producerId });
        } catch (e) {
          errb(e as any);
        }
      }
    );

    this.sendTransport.on("connectionstatechange", (state) => {
      if (state === "failed" || state === "closed") {
        this.events.onError?.(new Error("send transport state: " + state));
      }
    });
  }

  leave() {}
}
