import { createLocalStore } from './LocalStore';
const localStore = createLocalStore();
const fingerprint = localStore.get('fingerprint');
let fs = require("fs");
import electron from "electron";
const app = electron.app || electron.remote.app;
import path from "path";
import fetch from 'node-fetch';


let logDir = app.getPath("userData");
const writeLog = function () {
    const logArgs = Array.from(arguments).map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg));
    console.log(logArgs);
    try {
      const msg = logArgs.join(' ');
    //   fs.appendFile(logDir + '/trace.log', new Date().toISOString() + ":" + msg + "\n", function (err) {});
    } catch (e) {}
};
export  { writeLog };
