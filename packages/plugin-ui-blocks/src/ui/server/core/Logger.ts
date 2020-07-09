import ora from "ora";
import { EventEmitter } from "events";
import MemoryStream from "./MemoryStream";

class Logger extends EventEmitter {
  public id: string;
  public spinner: any;
  public log: string = "";
  public ws: MemoryStream = null;

  constructor() {
    super();
    this.ws = new MemoryStream({
      onData: this.onChildProcessData.bind(this)
    });
    this.spinner = ora({
      stream: this.ws
    });
  }

  public success(info?: string) {
    this.spinner.succeed(info);
  }

  public error(info?: string) {
    this.spinner.fail(info);
  }

  public succeed(info?: string) {
    this.spinner.succeed(info);
  }

  public start(info?: string) {
    this.spinner.start(info);
  }

  public fail(info?: string) {
    this.spinner.fail(info);
  }

  public stopAndPersist(option?) {
    this.spinner.stopAndPersist(option);
  }

  public setId(id: string) {
    this.id = id;
  }

  public clear() {
    this.log = "";
  }

  public getLog() {
    return this.log;
  }

  // Actively add logs
  public appendLog(data: string = "") {
    if (!data) {
      return;
    }
    this.log = `${this.log}${data}\n`;
    this.emit("log", {
      data: `${data}\n`
    });
  }

  /**
   * Accept logs from child processes
   *  1. ora: spinner process
   *  2. execa: Child process log
   */
  private onChildProcessData(chunk) {
    const data = chunk.toString();
    if (!data) {
      return;
    }
    this.log = `${this.log}${data}`;
    this.emit("log", {
      data
    });
  }
}

export default Logger;
