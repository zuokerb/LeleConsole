const electron = require('electron');
const fs = require('fs');
const path = require('path');
import { v4 as uuidv4 } from 'uuid';

export const defaults = generateSettings();

function generateSettings() {
  return {
    fingerprint: uuidv4(),
    lang: 'none',
  };
}

export function createLocalStore() {
  return new LocalStore('user-setting', Object.assign({}, defaults));
}

export default class LocalStore {
  constructor(filename, data) {
    const userDataPath = userDir();
    this.path = path.join(userDataPath, filename + '.json');
    this.data = this.parseDataFile(data);
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this.write2LocalFile(this.data);
  }

  write2LocalFile(data) {
    fs.writeFileSync(this.path, JSON.stringify(data));
  }

  parseDataFile(defaults) {
    if (fs.existsSync(this.path)) {
        const content = fs.readFileSync(this.path, 'utf8');
        let localData = {};
        try {
          localData = JSON.parse(content);
        } catch (error) {
          console.log(error);
        }
       
        let data = Object.assign(defaults, localData);
        this.write2LocalFile(data);
        return data;
    }
    this.write2LocalFile(defaults);
    return defaults;
  }
}

export function initDirectory(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

export function userDir() {
  let p;
  p = (electron.app || electron.remote.app).getPath('userData');
  return p;
}
