/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

import {
  Connection,
  Diff,
  F,
  ID,
  InputMem,
  NOPNotification,
  NotificationMode,
  NotifyingHolonParams,
  OnNotification,
  Path,
} from "./ts/types.ts";

import AsyncQueue from "./AsyncQueue.ts";

import { defaultNotifyingHolonParams } from "./ts/constants.ts";
export default class NotifyingHolon {
  //@ts-ignore
  static #byId: { [key: ID]: NotifyingHolon } = {};
  #queue = new AsyncQueue();
  #im: InputMem;
  #om: any;
  #data: { [key: string]: any } = {};
  #f: F;
  #diff: Diff;
  #outDiff: Diff;
  #pathsDiff: { //@ts-ignore
    [key: Path]: Diff;
  };
  #id: ID;
  #onNotification: OnNotification;
  #connections: Connection = new Map();

  /**
   * @param {f} Function, (im,data)=>any that builds the output operation, the default function just forwards the input memory.
   * @param {diff} Function, (val1,val2)=>boolean representing a inequality operator. The default function is the language inequality operator (!=).
   * @param {outDiff} Function, (val1,val2)=>boolean, specific for output representing a inequality operator. The default function is the language inequality operator (!=).
   * @param {pathsDiff} [key:Path]:(val1,val2)=>boolean, specific for each path representing a inequality operator. The default function is the language inequality operator (!=).
   * @param {initialInputMem} [key:Path]:any, Initial values ​​for input memory.
   * @param {initialOutMem} any, Initial values ​​for output memory.
   * @param {onNotification} Function, (n)=>void that intercepts notifications.
   * @param {id} string, holon id
   */
  constructor(params: NotifyingHolonParams = {}) {
    if (params.diff && !params.outDiff) {
      params.outDiff = params.diff;
    }
    params = { ...defaultNotifyingHolonParams, ...params };
    this.#f = params.f as F;
    this.#diff = params.diff as Diff;
    this.#outDiff = params.outDiff as Diff;
    this.#pathsDiff = params.pathsDiff as { //@ts-ignore
      [key: Path]: Diff;
    };
    this.#im = params.initialInputMem || {}; //can change, can't be in a constant
    this.#om = params.initialOutMem || undefined; //can change, can't be in a constant
    this.#onNotification = params.onNotification as OnNotification;
    this.#id = params.id as string;
    if (!this.#id) {
      this.#id = crypto.randomUUID();
    }
    NotifyingHolon.byId[this.#id as string] = this;
  }
  #inRuntimeIsNotification(input: any): boolean {
    if (typeof input !== "object") {
      return false;
    } else {
      return (("from" in input) && ("to" in input) &&
        ("value" in input) &&
        ("modes" in input) && ("time" in input) && ("activationTime" in input));
    }
  }
  #toNotification(
    input: any,
    path: Path,
    modes: NotificationMode[],
  ): NOPNotification {
    const time = Date.now();
    return {
      id: crypto.randomUUID(),
      from: null,
      to: this.id,
      value: input,
      path: path,
      modes: modes,
      time: time,
      activationTime: time,
    };
  }

  #standardizeNotifications(
    notifications: InputMem,
    modes: NotificationMode[],
  ): void {
    for (const param in notifications) {
      if (this.#inRuntimeIsNotification(notifications[param])) {
        if (!notifications[param].id) {
          notifications[param].id = crypto.randomUUID();
        }
      } else {
        notifications[param] = this.#toNotification(
          notifications[param],
          param,
          modes,
        );
      }
    }
  }
  async #processInput(
    notifications: InputMem,
    modes: NotificationMode[],
  ): Promise<void> {
    var activationTime: number = 0;
    var outActivation: boolean = false;
    var avaliated: boolean = false;
    this.#standardizeNotifications(notifications, modes);
    for (const param in notifications) {
      var activate: boolean = false;
      var diff = this.#diff;
      if (this.#pathsDiff[param]) {
        diff = this.#pathsDiff[param];
      }
      if (
        await diff(notifications[param].value, this.#im[param])
      ) {
        this.#im[param] = notifications[param].value;
        activate = true;
      } else if (notifications[param].modes.includes("STRONG")) {
        activate = true;
      }
      if (activate) {
        if (!activationTime) {
          activationTime = Date.now();
        }
      }
    }
    for (const param in notifications) {
      if (!notifications[param].modes.includes("WEAK")) {
        if (!outActivation) {
          if (activationTime > 0) {
            if (!avaliated) {
              var out: any = undefined;
              out = await this.#f(this.#im, this.data);
              outActivation = await this.#outDiff(out, this.#om);
              this.#om = out;
              avaliated = true;
            }
          }
          if (notifications[param].modes.includes("RENOTIFICATION")) {
            outActivation = true;
          }
        }
      }
      await this.#onNotification(notifications[param]);
    }
    if (outActivation) {
      var hasConn = false;
      const outTime = Date.now();
      for (const outHolonId of this.#connections.keys()) {
        hasConn = true;
        const out: { //@ts-ignore
          [key: Path]: NOPNotification;
        } = {};
        for (const path of this.#connections.get(outHolonId)!.keys()) {
          var connModes = this.#connections.get(outHolonId)!.get(path)!;
          out[path] = {
            id: crypto.randomUUID(),
            from: this.id,
            to: outHolonId,
            path: path,
            value: this.#om,
            modes: connModes,
            time: outTime,
            activationTime: activationTime,
          };
        }
        NotifyingHolon.byId[outHolonId].receive(out, []);
      }
      if (!hasConn) {
        const n: NOPNotification = {
          id: crypto.randomUUID(),
          from: this.id,
          to: null,
          path: "",
          value: this.#om,
          modes: [],
          time: outTime,
          activationTime: activationTime,
        };
        await this.#onNotification(n);
      }
    }
  }
  receive(
    notifications: InputMem,
    modes: NotificationMode[] = [],
  ): void {
    this.#queue.add(() => this.#processInput(notifications, modes));
  }

  initInputMem(paths: Path[]) {
    for (const path of paths) {
      if (!(path in this.#im)) {
        this.#im[path] = undefined;
      }
    }
  }

  connect( //@ts-ignore
    paths: { [key: Path]: NotifyingHolon | ID },
    modes: NotificationMode[] = [],
  ) {
    for (const path in paths) {
      const holonId = (typeof paths[path] === "object")
        ? (paths[path] as NotifyingHolon).id
        : paths[path];
      if (!holonId) {
        throw new Error(`Holon id at ${paths[path]} not found.`);
      }
      if (!this.#connections.get(holonId as ID)) {
        this.#connections.set(holonId as ID, new Map());
      }
      this.#connections.get(holonId as ID)!.set(path, modes);
      NotifyingHolon.byId[holonId as ID].initInputMem(
        Array.from(this.#connections.get(holonId as ID)!.keys()),
      );
    }
  }
  get connections() {
    return this.#connections;
  }
  toString(): string {
    return JSON.stringify(this.#id);
  }
  toJSON(): any {
    const data: any = {
      im: this.#im,
      om: this.#om,
      data: this.#data,
      f: this.#f,
      diff: this.#diff,
      outDiff: this.#outDiff,
      pathsDiff: this.#pathsDiff,
      onNotification: this.#onNotification,
      id: this.#id,
      connections: this.#connections,
    };
    data.f = data.f.toString();
    data.diff = data.f.toString();
    data.outDiff = data.outDiff.toString();
    for (const key in data.pathsDiff) {
      data.pathsDiff[key] = data.pathsDiff[key].toString();
    }
    data.onNotification = data.onNotification.toString();
    data.connections = Array.from(data.connections);
    for (const conn of data.connections) {
      conn[1] = Array.from(conn[1]);
    }
    return data;
  }
  static toJSON(): any {
    return NotifyingHolon.byId;
  }
  get id(): ID {
    return this.#id as string;
  }
  static get byId(): { [key: ID]: NotifyingHolon } {
    return NotifyingHolon.#byId;
  }
  get data(): { [key: string]: any } {
    return this.#data;
  }
}
