/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/site/henriqueemanoelviana
cel: +55 (41) 99999-4664
*/

import HistoryGraph from "./HistoryGraph.ts";
import {
  Connection,
  Diff,
  F,
  ID,
  InputMem,
  NOPNotification,
  NotificationMode,
  NotifyingCellParams,
  OnNotification,
  Path,
  Symbols,
} from "./ts/types.ts";

import AsyncQueue from "./AsyncQueue.ts";

import { defaultNotifyingCellParams } from "./ts/constants.ts";
export default class NotifyingCell {
  static #notificationModeOrder: NotificationMode[] = [
    "WEAK",
    "",
    "STRONG",
    "RENOTIFICATION",
  ];
  //@ts-ignore
  static #byId: { [key: ID]: NotifyingCell } = {};
  static #historyGraph = new HistoryGraph();
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
  #onNotification: OnNotification;
  #symbols: Symbols;
  #connections: Connection = new Map();
  static historyEnabled: boolean = false;

  /**
   * @param {f} Function, (im,data)=>any that builds the output operation, the default function just forwards the input memory.
   * @param {diff} Function, (val1,val2)=>boolean representing a inequality operator. The default function is the language inequality operator (!=).
   * @param {outDiff} Function, (val1,val2)=>boolean, specific for output representing a inequality operator. The default function is the language inequality operator (!=).
   * @param {pathsDiff} [key:Path]:(val1,val2)=>boolean, specific for each path representing a inequality operator. The default function is the language inequality operator (!=).
   * @param {initialInputMem} [key:Path]:any, Initial values ​​for input memory.
   * @param {initialOutMem} any, Initial values ​​for output memory.
   * @param {onNotification} Function, (n)=>void that intercepts notifications.
   * @param {symbols} [key:string]:string|string[], symbols that help to identify and organize reporting cells.
   */
  constructor(params: NotifyingCellParams) {
    if (params.diff && !params.outDiff) {
      params.outDiff = params.diff;
    }
    params = { ...defaultNotifyingCellParams, ...params };
    this.#f = params.f;
    this.#diff = params.diff;
    this.#outDiff = params.outDiff;
    this.#pathsDiff = params.pathsDiff;
    this.#im = params.initialInputMem || {}; //can change, can't be in a constant
    this.#om = params.initialOutMem || undefined; //can change, can't be in a constant
    this.#onNotification = params.onNotification;
    this.#symbols = params.symbols || {}; //can change, can't be in a constant
    if (!this.#symbols["id"]) {
      this.#symbols["id"] = crypto.randomUUID();
    }
    NotifyingCell.byId[this.#symbols["id"]] = this;
  }
  #inRuntimeIsNotification(input: any): boolean {
    if (typeof input !== "object") {
      return false;
    } else {
      return (("from" in input) && ("to" in input) &&
        ("notification" in input) &&
        ("mode" in input) && ("time" in input) && ("activationTime" in input) &&
        ("symbols" in input));
    }
  }
  #toNotification(
    input: any,
    path: Path,
    mode: NotificationMode,
    symbols: Symbols,
  ): NOPNotification {
    const time = Date.now();
    return {
      id: crypto.randomUUID(),
      from: null,
      to: this.id,
      notification: input,
      symbols: symbols,
      path: path,
      mode: mode,
      time: time,
      activationTime: time,
    };
  }
  async #processInput(
    notifications: InputMem,
    mode: NotificationMode,
    symbols: Symbols,
  ): Promise<void> {
    var activationTime: number = 0;
    var hasInputChange: boolean = false;
    for (const param in notifications) {
      if (!this.#inRuntimeIsNotification(notifications[param])) {
        notifications[param] = this.#toNotification(
          notifications[param],
          param,
          mode,
          symbols,
        );
      } else {
        notifications[param].mode = mode;
        if (!notifications[param].id) {
          notifications[param].id = crypto.randomUUID();
        }
      }
      var diff = this.#diff;
      if (this.#pathsDiff[param]) {
        diff = this.#pathsDiff[param];
      }
      if (
        (await diff(notifications[param].notification, this.#im[param]))
      ) {
        if (!activationTime) {
          activationTime = Date.now();
        }
        this.#im[param] = notifications[param].notification;
        hasInputChange = true;
      } else if ((mode === "RENOTIFICATION") || (mode === "STRONG")) {
        if (!activationTime) {
          activationTime = Date.now();
        }
      }
      if (NotifyingCell.historyEnabled) {
        NotifyingCell.history.add(notifications[param]);
      }
      this.#onNotification(notifications[param]);
    }
    if (mode !== "WEAK") {
      if (activationTime) {
        var out: any = undefined;
        var outActivation = false;
        if (hasInputChange || (mode === "STRONG")) {
          out = await this.#f(this.#im, this.data);
          if (mode === "RENOTIFICATION") {
            outActivation = true;
          } else {
            outActivation = await this.#outDiff(out, this.#om);
          }
        } else {
          out = this.#om;
          outActivation = true;
        }
        var hasConn = false;
        if (outActivation) {
          this.#om = out;
          const outTime = Date.now();
          for (const outCellId of this.#connections.keys()) {
            hasConn = true;
            const out: { //@ts-ignore
              [key: NotificationMode]: { [key: Path]: NOPNotification };
            } = {};
            for (const path of this.#connections.get(outCellId)!.keys()) {
              var connMode = this.#connections.get(outCellId)!.get(path)![0];
              //grouping by notification mode
              if (!out[connMode]) {
                out[connMode] = {};
              }
              out[connMode][path] = {
                id: crypto.randomUUID(),
                from: this.id,
                to: outCellId,
                path: path,
                notification: this.#om,
                symbols: {},
                mode: connMode,
                time: outTime,
                activationTime: activationTime,
              };
            }
            for (const cMode of NotifyingCell.#notificationModeOrder) {
              if (out[cMode]) {
                NotifyingCell.byId[outCellId].receive(out[cMode], cMode);
              }
            }
          }
          if (!hasConn) {
            const n: NOPNotification = {
              id: crypto.randomUUID(),
              from: this.id,
              to: null,
              path: "",
              notification: this.#om,
              symbols: {},
              mode: "",
              time: outTime,
              activationTime: activationTime,
            };
            if (NotifyingCell.historyEnabled) {
              NotifyingCell.history.add(n);
            }
            this.#onNotification(n);
          }
        }
      }
    }
  }
  receive(
    notifications: InputMem,
    mode: NotificationMode = "",
    symbols: Symbols = {},
  ): void {
    this.#queue.add(() => this.#processInput(notifications, mode, symbols));
  }

  connect( //@ts-ignore
    paths: { [key: Path]: NotifyingCell | ID },
    mode: NotificationMode = "",
    symbols: Symbols = {},
  ) {
    for (const path in paths) {
      const cellId = (typeof paths[path] === "object")
        ? (paths[path] as NotifyingCell).id
        : paths[path];
      if (!cellId) {
        throw new Error(`Cell id at ${paths[path]} not found.`);
      }
      if (!this.#connections.get(cellId as ID)) {
        this.#connections.set(cellId as ID, new Map());
      }
      this.#connections.get(cellId as ID)!.set(path, [mode, symbols]);
    }
  }
  get connections() {
    return this.#connections;
  }
  toString(): string {
    return JSON.stringify(this.#symbols);
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
      symbols: this.#symbols,
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
    return NotifyingCell.byId;
  }
  get symbols(): Symbols {
    return this.#symbols;
  }
  get id(): ID {
    return this.#symbols["id"];
  }
  static get byId(): Symbols {
    return NotifyingCell.#byId;
  }
  get data(): { [key: string]: any } {
    return this.#data;
  }
  static get history(): HistoryGraph {
    return NotifyingCell.#historyGraph;
  }
}
