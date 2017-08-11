"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const bluebird = require("bluebird");
const config_1 = require("./config");
bluebird.promisifyAll(redis_1.RedisClient.prototype);
bluebird.promisifyAll(redis_1.Multi.prototype);
const PID = process.pid.toString();
const redisClient = redis_1.createClient(config_1.REDIS_OPTIONS);
redisClient.on("error", error => {
    console.error(error);
    quit();
});
let processedMessagesCounter = 0, isIAmTheGenerator = false;
console.log(`\nworker (pid ${PID}) started`);
if (process.argv[2] && process.argv[2] === "getErrors")
    getErrors()
        .then(quit);
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
        redisClient.watch("generatorPID");
        if (await redisClient.pttlAsync("generatorPID") <= 0) {
            await redisClient
                .multi([
                ["setex", "generatorPID", config_1.CAPTURE_GENERATOR_DELAY, PID]
            ])
                .execAsync()
                && await startGenerateMessages();
        }
        else
            redisClient.unwatch();
    }
    catch (e) {
        console.error(`worker (pid ${PID}) capture generatorPID transaction failed`);
    }
}
async function startGenerateMessages() {
    isIAmTheGenerator = true;
    console.log(`\nworker (pid ${PID}) NOW I AM THE CHOOSEN ONE!!!111\n`);
    preparePhilosophicalQuestion();
    setInterval(processGenerateMessages, config_1.MESSAGE_DELAY);
}
async function processGenerateMessages() {
    await redisClient.expireAsync("generatorPID", config_1.CAPTURE_GENERATOR_DELAY);
    await redisClient.lpushAsync("messageList", await generateMessage());
}
async function getMessage() {
    let message = null;
    const messageItem = await redisClient.brpopAsync("messageList", config_1.MESSAGE_WAIT_FOR);
    if (messageItem && messageItem[1])
        message = messageItem[1];
    if (message) {
        await redisClient.incrAsync("processedMessagesAmount");
        await processMessage(message);
    }
}
async function isGeneratorAlive() {
    return await redisClient.pttlAsync("generatorPID") > 0;
}
async function processMessage(message) {
    if (config_1.MESSAGE_POOL <= 1)
        console.log(`worker (pid ${PID}) processing message ${message}`);
    else if (processedMessagesCounter > 0 && processedMessagesCounter % config_1.MESSAGE_POOL === 0)
        console.log(`worker (pid ${PID}) processed ${processedMessagesCounter} messages`);
    if (Math.random() < config_1.ERROR_PERCENT) {
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
function generateMessage(length = 5) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", charsetLength = charset.length;
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
    }, config_1.MAX_LIFETIME);
}
function quit() {
    redisClient.quit();
    process.exit(0);
}
