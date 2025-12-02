// 网络消息管理者
/*import 'core-js'
import { Encoder, Decoder } from "@msgpack/msgpack";*/
//import { default as msgpack } from "msgpack-lite";
import msgpack from "msgpack-lite/dist/msgpack.min.js";
import { Base64 } from 'js-base64';
import { NetworkManager } from './NetworkManager';

async function waitMilliseconds(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

// 接收缓存生成器
/*async function* receivedBufferGenerator(): AsyncGenerator<Uint8Array> {
    while (true) {
        if (NetworkManager.Instance.ReceivedBufferCount === 0) {
            await waitMilliseconds(3000);
            console.log("test Generator");
        } else {
            yield NetworkManager.Instance.takeReceivedBuffer();
        }
    }
}*/

export class MsgWrapper {
    public msgType: string = null;
    public msg: any = null;
}

export interface NetMsgHandler {
    onMessage(msgType: string, msg: any): boolean;
}

export class NetMsgManager {
    private static _instance: NetMsgManager = null;

    public static get Instance(): NetMsgManager {
        if (NetMsgManager._instance == null) {
            NetMsgManager._instance = new NetMsgManager();
        }
        return NetMsgManager._instance;
    }

    private unpackMessageProcedure() {
        /*let dataStream = receivedBufferGenerator();
        for await (const item of decodeMultiStream(dataStream)) {
            
        }*/
        //const items = [ "foo", 10, { name: "bar", }, [1, 2, 3], ];
        /*const createStream = async function* (): AsyncGenerator<Uint8Array> {
            for (const item of items) {
                yield encode(item);
            }
        };
        const result: Array<unknown> = [];
        for await (const item of decodeMultiStream(createStream())) {
            console.log(item);
        }*/
        /*let encoder = new Encoder();
        const encodedItems = items.map((item) => encoder.encode(item));
        const encoded = new Uint8Array(encodedItems.reduce((p, c) => p + c.byteLength, 0));
        let offset = 0;
        for (const encodedItem of encodedItems) {
            encoded.set(encodedItem, offset);
            offset += encodedItem.byteLength;
        }
        let decoder = new Decoder();
        for (const item of decoder.decodeMulti(encoded)) {
            console.log(item);
        }*/
        var src = [
            ["foo"],
            ["bar"],
            ["baz"]
        ];

        var encoded = [
            msgpack.encode(src[0]),
            msgpack.encode(src[1]),
            msgpack.encode(src[2])
        ];
        console.log(encoded[0]);
        console.log(encoded[1]);
        console.log(encoded[2]);

        var decoder = msgpack.createDecodeStream();

        decoder.on("data", onData);
        decoder.write(encoded[0]);
        decoder.write(encoded[1]);
        //decoder.write(encoded[2]);
        decoder.end();

        function onData(data) {
            console.log(data);
        }
    }

    // 初始化标志
    private inited = false;

    // msgpack解码器
    //private decoder: msgpack.Decoder = null;

    // 缓存数据
    private cachedData: Uint8Array = null;

    // 消息队列
    private msgQueue: MsgWrapper[] = [];

    private handlers: NetMsgHandler[] = [];

    public init() {
        if (this.inited) return;
        this.inited = true;
        //this.unpackMessageProcedure();
        //this.decoder = msgpack.createDecodeStream();
        //this.decoder.on("data", (data: any) => { this.onDecode(data); });
    }

    public receiveData(buf: Uint8Array) {
        /*if (this.decoder) {
            this.decoder.write(buf);
        }*/
        try {
            let msg: any = msgpack.decode(buf);
            if (!(msg && msg.msgType)) {
                this.cacheData(buf);
                return;
            }
            this.onDecode(msg);
        }
        catch (err) {
            this.cacheData(buf);
        }
    }

    private cacheData(buf: Uint8Array) {
        if (this.cachedData && (this.cachedData.length > 2097152)) {
            // 最大只缓存2MB数据
            console.error("Cached data discarded.");
            this.cachedData = null;
        }
        let test: boolean = false;
        if (this.cachedData) {
            let newBuffer = new Uint8Array(this.cachedData.length + buf.length);
            newBuffer.set(this.cachedData);
            newBuffer.set(buf, this.cachedData.length);
            this.cachedData = newBuffer;
        } else {
            test = true;
            this.cachedData = buf;
        }
        if (test) return;
        try {
            let msg: any = msgpack.decode(this.cachedData);
            if (!(msg && msg.msgType)) return;
            this.onDecode(msg);
            console.log("Cached data size: ", this.cachedData.length);
            this.cachedData = null;
        }
        catch (err) { }
    }

    private onDecode(data: any) {
        try {
            let buf: Uint8Array = Base64.toUint8Array(data.msgPack);
            let mw = new MsgWrapper();
            mw.msgType = data.msgType;
            mw.msg = msgpack.decode(buf);
            this.pushMessage(mw);
        } catch (err) {
            console.log(data);
            console.log(data.msgType);
            console.log(data.msgPack);
            console.log("Unpack message error: ", err);
        }
    }

    private pushMessage(mw: MsgWrapper) {
        this.msgQueue.push(mw);
    }

    private popMessage() {
        if (this.msgQueue.length === 0) return null;
        return this.msgQueue.shift();
    }

    public registerHandler(handler: NetMsgHandler) {
        if (!handler) return;
        this.handlers.push(handler);
    }

    public unregisterHandler(handler: NetMsgHandler) {
        // 找到元素的索引
        let index = this.handlers.findIndex((item) => { return (item === handler); });
        if (index !== -1) {
            // 检查是否找到了元素
            // 从找到的索引处删除1个元素
            this.handlers.splice(index, 1); 
        }
    }

    public handleMessages() {
        let mw: MsgWrapper = this.popMessage();
        while (mw != null) {
            this.onMessage(mw);
            mw = this.popMessage();
        }
    }

    private onMessage(mw: MsgWrapper) {
        try {
            let test = false;
            for (let handler of this.handlers) {
                if (handler.onMessage(mw.msgType, mw.msg)) {
                    test = true;
                    break;
                }
            }
            if (!test && (mw.msgType !== "MsgAvatarConnect")) {
                console.error("Message(type: ", mw.msgType, ") has no handler");
            }
        }
        catch (err) {
            let tip: string = "Handle message(type: " + mw.msgType + ") error: ";
            console.log(tip, err);
        }
    }
}

