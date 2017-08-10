import {ChildProcess, fork} from "child_process";
import {join} from "path";

import {DEFAULT_WORKERS_AMOUNT} from "./config";

spawnWorkers();

function spawnWorkers() {
    for (let j = 0; j < DEFAULT_WORKERS_AMOUNT; j++) {
        let child: ChildProcess = null;
        try {
            child = fork(join(__dirname, "worker.js"));
        } catch (e) {
            console.error(e);
        }
    }
}
