// 网络相关
//import { default as msgpack } from "msgpack-lite";
import msgpack from "msgpack-lite/dist/msgpack.min.js";
import { Base64 } from 'js-base64';
import { Client } from "../Game/Client";
import { GameManager } from "./GameManager";
import { NetMsgManager, NetMsgHandler, MsgWrapper } from "./NetMsgManager";
import { ConnectionState, EnterVenueState } from "../Common/ConstDefines";
import { CommonUtils } from "../Utils/CommonUtils";

class WebSocketConnection {
    private id: number = 0;

    constructor(id: number) {
        this.id = id;
    }

    public get Id(): number {
        return this.id;
    }

    // websocket
    private ws: WebSocket = null;

    // 废弃时间，时间戳(毫秒)
    private abandonTime: number = 0;

    public isConnected(): boolean {
        if (!this.ws) return false;
        return (this.ws.readyState === WebSocket.OPEN);
    }

    public connect(address: string) {
        this.ws = new WebSocket(address, []);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = (event: Event) => { this.onOpen(event); };
        this.ws.onmessage = (event: MessageEvent) => { this.onMessage(event); };
        this.ws.onerror = (event: Event) => { this.onError(event); };
        this.ws.onclose = (event: CloseEvent) => { this.onClose(event); };
    }

    public abandon() {
        if (!this.ws) return;
        this.abandonTime = Date.now();
        this.ws.close();
        console.log("Close connection, id: ", this.id);
    }

    private onOpen(event: Event) {
        NetworkManager.Instance.onOpen(this, event);
    }

    private onMessage(event: MessageEvent) {
        NetworkManager.Instance.onReceiveData(this, event);
    }

    private onError(event: Event) {
        NetworkManager.Instance.onError(this, event);
    }

    private onClose(event: CloseEvent) {
        NetworkManager.Instance.onClose(this, event);
    }

    public getAbandonTime(): number {
        return this.abandonTime;
    }

    public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        try {
            this.ws.send(data);
        }
        catch (err) {
            console.log("Send data error: ", err);
        }
    }
}

// 网络连接接口
export interface ConnectionHandler {
    // 通知离线
    onDisconnect(): void;

    // 通知重连
    onReconnect(): void;
}

export class NetworkManager implements NetMsgHandler  {
    private static _instance: NetworkManager = null;

    public static get Instance(): NetworkManager {
        if (NetworkManager._instance == null) {
            NetworkManager._instance = new NetworkManager();
            NetMsgManager.Instance.registerHandler(NetworkManager._instance);
        }
        return NetworkManager._instance;
    }

    // 连接计数器，用于分配连接id
    private counter: number = 1;

    // 服务器地址
    private address: string = null;

    // 当前连接
    private connection: WebSocketConnection = null;

    // 已废弃的连接
    private abandonedConnections: WebSocketConnection[] = [];

    // 当前网络连接状态
    private connectionState: ConnectionState = ConnectionState.Disconnect;

    // 距本次发起连接已过了多久，单位秒
    private connectElapsed: number = 0;

    // 当前连接重试次数
    private retryCount: number = 0;

    // 在浏览器页面失去焦点时发生重连
    private lostFucusReconnect: boolean = false;

    // 距上一次向服务器发送心跳已过多久，单位秒
    private heartbeatElapsed: number = 0;

    // 上一次发送心跳后是否收到服务器的心跳回复
    private heartbeatReceived: boolean = false;

    // 心跳计数器
    private heartbeat = 0;

    private handlers: ConnectionHandler[] = [];

    public connect(address: string, reconnect: boolean = false) {
        // 废弃当前连接实例
        this.abandon();
        if (!reconnect) {
            this.retryCount = 1;
        }
        this.address = address;
        this.connectElapsed = 0;
        this.connectionState = ConnectionState.Connecting;
        this.connection = new WebSocketConnection(this.counter);
        this.counter += 1;
        if (this.counter > 99999) {
            this.counter = 1;
        }
        this.connection.connect(address);
    }

    public reconnect() {
        if (this.retryCount > 2) {
            // 重试次数已经达到3次，认为无法连接到服务器
            if (GameManager.Instance.EnterVenueState !== EnterVenueState.Leaved) {
                GameManager.Instance.leaveVenue();
                Client.Instance.showConnecting(false);
                Client.Instance.showPromptDialog("网络连接失败，请检查网络设置");
            }
            return;
        }
        if (!this.address) return; 
        // 登录已失效，直接返回
        if (CommonUtils.isStringEmpty(GameManager.Instance.Token)) return;
        if (GameManager.Instance.EnterVenueState === EnterVenueState.Leaved) return;
        this.retryCount += 1;
        this.connect(this.address, true);
        Client.Instance.showConnecting(true);
    }

    public onOpen(con: WebSocketConnection, event: Event) {
        if (this.isAbandoned(con)) return;
        this.connectionState = ConnectionState.Connected;
        this.retryCount = 0;
        this.heartbeatElapsed = 0;
        this.heartbeatReceived = true;
        Client.Instance.showConnecting(false);

        // 发送连接消息
        this.sendMessage("MsgPlayerConnect", {}, true);

        GameManager.Instance.onConnected();
    }

    public onReceiveData(con: WebSocketConnection, event: MessageEvent) {
        if (this.isAbandoned(con)) return;
        if (event.data instanceof ArrayBuffer) {
            NetMsgManager.Instance.receiveData(new Uint8Array(event.data));
        }
    }

    public onError(con: WebSocketConnection, event: Event) {
        if (this.isAbandoned(con)) return;
        console.log("onError");
    }

    public onClose(con: WebSocketConnection, event: CloseEvent) {
        if (this.isAbandoned(con)) return;
        this.heartbeatElapsed = 0;
        if (this.connectionState === ConnectionState.Connecting) {
            Client.Instance.showConnecting(false);
        }
        this.connectionState = ConnectionState.Disconnect;
        this.onDisconnect();
        if (document.hasFocus()) {
            this.reconnect();
        } else {
            this.lostFucusReconnect = true;
            console.log("Current document lose focus.");
        }
    }

    public isConnected(): boolean {
        if (!this.connection) return false;
        return this.connection.isConnected();
    }

    public abandon() {
        if (this.connection) {
            // 继续持有连接实例，以保证该实例的后续回调仍能正常执行
            this.abandonedConnections.push(this.connection);
            this.connection.abandon();
            this.connection = null;
        }
    }

    private removeAbandoned() {
        let count: number = this.abandonedConnections.length;
        if (count < 1) return;
        let nowTime: number = Date.now();
        let nums = 0;
        for (let i: number = 0; i < count; i++) {
            let con: WebSocketConnection = this.abandonedConnections[i];
            let delta = nowTime - con.getAbandonTime();
            if (delta > 10000) {
                // 已废弃超过10秒，删除，不再持有该实例
                nums++;
            } else {
                break;
            }
        }
        if (nums > 0) {
            this.abandonedConnections.splice(0, nums);
        }
    }

    public isAbandoned(con: WebSocketConnection): boolean {
        if (!con) return false;
        if (!this.connection) return false;
        return (this.connection.Id !== con.Id);
    }

    public update(deltaTime: number) {
        this.removeAbandoned();
        if (this.lostFucusReconnect) {
            this.lostFucusReconnect = false;
            this.reconnect();
            return;
        }
        if (this.connectionState === ConnectionState.Connecting) {
            this.connectElapsed += deltaTime;
            if (this.connectElapsed > 5.0) {
                console.error("Connect fail");
                // 距本次发起连接已经超过5秒仍未成功亦未失败，认为连接失败
                this.connectionState = ConnectionState.Disconnect;
                Client.Instance.showConnecting(false);
                this.reconnect();
            }
        }
        if (this.connectionState === ConnectionState.Connected &&
            GameManager.Instance.EnterVenueState === EnterVenueState.Entered) {
            // 登录已失效，直接返回
            if (CommonUtils.isStringEmpty(GameManager.Instance.Token)) return;
            // 已连接并且已进入场地
            this.heartbeatElapsed += deltaTime;
            if (this.heartbeatElapsed > 5.0) {
                if (!this.heartbeatReceived) {
                    // 距上一次发送心跳已经过了5秒，但仍未收到回复，认为连接断开，重新连接
                    this.onDisconnect();
                    this.reconnect();
                }
                else {
                    // 超5秒未发送心跳，再次发送心跳
                    console.log("Send heartbeat");
                    this.sendHeartbeat();
                }
            }
        }
    }

    /**
     * 想服务器发送消息
     * @param msgType 消息类型
     * @param msg 消息体
     * @param signature 是否需要签名
     */
    public sendMessage(msgType: string, msg: any, signature: boolean): void {
        if (!this.isConnected()) return;
        if (!msgType || !msg) return;
        try {
            if (signature) {
                // 需要做消息签名
                msg = GameManager.Instance.signatureMessage(msg);
            }
            if (!msg) return;
            let buf = msgpack.encode(msg);
            if (!buf) {
                console.log("Serialize message error");
                return;
            }
            let data = {
                msgType: msgType,
                msgPack: Base64.fromUint8Array(buf)
            };
            buf = msgpack.encode(data);
            this.connection.send(buf);
        }
        catch (err) {
            console.log("Serialize message error: ", err);
        }
    }

    /**
     * 发送场地内消息
     * @param msgType 消息类型
     */
    public sendInnerMessage(msgType: string) {
        if (!this.isConnected()) return;
        if (!msgType) return;
        if (GameManager.Instance.EnterVenueState !== EnterVenueState.Entered) return;
        let msg = {
            venueId: GameManager.Instance.VenueId
        };
        this.sendMessage(msgType, msg, true);
    }

    private sendHeartbeat() {
        this.heartbeatElapsed = 0;
        this.heartbeatReceived = false;
        let msg = {
            counter: this.heartbeat,
            venueId: GameManager.Instance.VenueId
        };
        this.sendMessage("MsgHeartbeat", msg, true);
    }

    public registerHandler(handler: ConnectionHandler) {
        if (!handler) return;
        this.handlers.push(handler);
    }

    public unregisterHandler(handler: ConnectionHandler) {
        // 找到元素的索引
        let index = this.handlers.findIndex((item) => { return (item === handler); });
        if (index !== -1) {
            // 检查是否找到了元素
            // 从找到的索引处删除1个元素
            this.handlers.splice(index, 1);
        }
    }

    private receivedBufferArray: Uint8Array[] = [];

    public get ReceivedBufferCount(): number {
        return this.receivedBufferArray.length;
    }

    public takeReceivedBuffer(): Uint8Array {
        if (this.receivedBufferArray.length === 0) return null;
        return this.receivedBufferArray.shift();
    }

    public onMessage(msgType: string, msg: any): boolean {
        let ret: boolean = true;
        if (msgType === "MsgPlayerConnectResp") {
            this.onPlayerConnectResp(msg);
        }
        else if (msgType === "MsgEnterVenueResp") {
            this.onEnterVenueResp(msg);
        }
        else if (msgType === "MsgHeartbeatResp") {
            this.onHeartbeatResp(msg);
        }
        else if (msgType === "MsgPlayerSignatureError") {
            GameManager.Instance.onPlayerSignatureError(msg);
        }
        else {
            ret = false;
        }
        return ret;
    }

    private onDisconnect() {
        try {
            for (let handler of this.handlers) {
                handler.onDisconnect();
            }
        }
        catch (err) {
            console.log("Handle disconnect error: ", err);
        }
    }

    private onPlayerConnectResp(msg: any) {
        if (GameManager.Instance.EnterVenueState != EnterVenueState.Entered) return;
        try {
            for (let handler of this.handlers) {
                handler.onReconnect();
            }
        }
        catch (err) {
            console.log("Handle reconnect error: ", err);
        }
    }

    private onEnterVenueResp(msg: any) {
        if (msg.code === 0) {
            // 进入成功
            this.heartbeatElapsed = 0;
            this.heartbeatReceived = true;
            GameManager.Instance.onEnterVenue(msg.venueId);
            console.log("Enter venue(id: ", msg.venueId, ") success");
        }
        else {
            // 进入场地失败，断开网络连接
            this.abandon();
            let errMsg: string = "进入游戏失败: " + msg.errMsg;
            GameManager.Instance.onEnterFailed(msg.venueId, errMsg);
        }
    }

    private onHeartbeatResp(msg: any) {
        this.heartbeat++;
        if (this.heartbeat > 99999) {
            this.heartbeat = 0;
        }
        this.heartbeatReceived = true;
    }
}
