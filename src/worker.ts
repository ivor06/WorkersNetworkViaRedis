import {createClient, RedisClient, Multi} from "redis";
import * as bluebird from "bluebird";

import {RedisClientAsyncable} from "./interfaces";
import {
    REDIS_OPTIONS,
    MESSAGE_DELAY,
    MESSAGE_POOL,
    CAPTURE_GENERATOR_DELAY,
    MESSAGE_WAIT_FOR,
    MAX_LIFETIME,
    ERROR_PERCENT
} from "./config";

const PID = process.pid.toString();

const redisClient = createClient(REDIS_OPTIONS) as RedisClientAsyncable;

let
    processedMessagesCounter = 0,
    isIAmTheGenerator = false;

init();

mainLoop()
    .catch(quit);

async function mainLoop() {
    while (!isIAmTheGenerator) {
        await isGeneratorAlive()
            ? await getMessage()
            : await startElectionOfGenerator();
    }
}

async function startElectionOfGenerator() {
    try {
        redisClient.watch("generatorPID"); // Optimistic locking: only one of workers would set generatorPID with expire time
        if (await redisClient.pttlAsync("generatorPID") <= 0) { // Checking if generatorPID captured already
            await redisClient
                .multi([ // Capturing of generatorPID
                    ["setex", "generatorPID", CAPTURE_GENERATOR_DELAY, PID] // Only one of workers returns not-null-result cause optimistic locking
                ])
                .execAsync()
            && await startGenerateMessages();
        } else
            redisClient.unwatch(); // Too late: someone already captured generatorPID
    } catch (e) {
        console.error(`worker (pid ${PID}) capture generatorPID transaction failed`);
    }
}

async function startGenerateMessages() {
    isIAmTheGenerator = true;

    console.log(`\nworker (pid ${PID}) NOW I AM THE CHOOSEN ONE!!!111\n`);

    preparePhilosophicalQuestion();

    setInterval(processGenerateMessages, MESSAGE_DELAY);
}

async function processGenerateMessages() {
    await redisClient.expireAsync("generatorPID", CAPTURE_GENERATOR_DELAY); // Prolonging of generatorPID capture
    await redisClient.lpushAsync("messageList", await generateMessage());
}

async function getMessage() {
    let message: string = null;
    const messageItem = await redisClient.brpopAsync("messageList", MESSAGE_WAIT_FOR);
    if (messageItem && messageItem[1])
        message = messageItem[1];

    if (message)
        await processMessage(message);
}

async function isGeneratorAlive(): Promise<boolean> {
    return await redisClient.pttlAsync("generatorPID") > 0;
}

async function processMessage(message: any): Promise<void> {
    if (MESSAGE_POOL <= 1)
        console.log(`worker (pid ${PID}) processing message ${message}`);
    else if (processedMessagesCounter > 0 && processedMessagesCounter % MESSAGE_POOL === 0)
        console.log(`worker (pid ${PID}) processed ${processedMessagesCounter} messages`);

    if (Math.random() < ERROR_PERCENT) {
        console.log(`worker (pid ${PID}) Error detected!`);
        await redisClient.lpushAsync("errorList", message);
    }

    processedMessagesCounter++;
}

async function getErrors() {
    const errorList = await redisClient.lrangeAsync("errorList", 0, -1);
    await redisClient.delAsync("errorList");
    console.log("Error list:");
    (errorList.length > 0)
        ? errorList.forEach(error => console.log(error))
        : console.log("---empty---");
}

function generateMessage(length = 5): string {
    const
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        charsetLength = charset.length;
    let message = "";
    for (let i = 0; i < length; i++) {
        message += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
    return message;
}

function preparePhilosophicalQuestion() {
    setTimeout(() => {
        console.log(`\nworker (pid ${PID}) Who are we in the perishable world? Just grains of sand.. Good bye my friends..`);
        quit();
    }, MAX_LIFETIME);
}

function quit() {
    // redisClient.quit(); // Application suddenly crashes, we can't quit gracefully, isn't it? :)
    process.exit(0);
}

function init() {
    bluebird.promisifyAll(RedisClient.prototype); // Promisify Redis client
    bluebird.promisifyAll(Multi.prototype); // Now promise-returning functions available, such as "getAsync"

    redisClient.on("error", error => {
        console.error(error);
        quit();
    });

    if (process.argv[2] && process.argv[2] === "getErrors")
        getErrors()
            .then(quit);

    console.log(`\nworker (pid ${PID}) started`);
}
