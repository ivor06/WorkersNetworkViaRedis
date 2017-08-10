import {RedisClient, Multi} from "redis";

export {
    RedisClientAsyncable
}

interface MultiAsync extends Multi {
    setex: (key: string, seconds: number, value: string) => MultiAsync;
    execAsync: () => Promise<boolean>;
}

// It is necessary to extend RedisClient with async versions of client methods after promisify by Bluebird
interface RedisClientAsyncable extends RedisClient {
    getAsync: (key: string) => Promise<string>;
    delAsync: (key: string) => Promise<number>;
    setAsync: (key: string, value: any, modeOrFlag?: string, duration?: number) => Promise<number>;
    setexAsync: (key: string, seconds: number, value: string|number) => Promise<number>;
    incrAsync: (key: string) => Promise<number>;
    brpopAsync: (key: string, timeout?: number) => Promise<[string, string]>;
    lpushAsync: (key: string, value: any) => Promise<number>;
    lrangeAsync: (key: string, start: number, stop: number) => Promise<string[]>;
    ltrimAsync: (key: string, start: number, stop: number) => Promise<number>;
    llenAsync: (key: string) => Promise<number>;
    pttlAsync: (key: string) => Promise<number>;
    expireAsync: (key: string, seconds: number) => Promise<number>;
    timeAsync: () => Promise<[string, string]>;
    multiAsync: () => Promise<[string, string]>;
    publishAsync: (channel: string, value: string) => Promise<number>;
    subscribeAsync: (channel: string, value: string) => Promise<number>;
    multi: (args?: Array<Array<string|number>>) => MultiAsync;
}
