"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const config_1 = require("./config");
spawnWorkers();
function spawnWorkers() {
    for (let j = 0; j < config_1.DEFAULT_WORKERS_AMOUNT; j++) {
        let child = null;
        try {
            child = child_process_1.fork(path_1.join(__dirname, "worker.js"));
        }
        catch (e) {
            console.error(e);
        }
    }
}
