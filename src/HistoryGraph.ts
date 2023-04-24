/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

import { GraphEngine } from "./ts/types.ts";

import { defaultGraphEngine } from "./ts/constants.ts";

export default class HistoryGraph {
  #engine: GraphEngine;
  constructor(
    engine: GraphEngine = defaultGraphEngine,
  ) {
    this.#engine = engine; //fix ts
    this.setEngine(engine);
  }
  setEngine(engine: GraphEngine) {
    this.#engine = engine;
  }
  get childs() {
    return this.#engine.childsFunc;
  }
  get parents() {
    return this.#engine.parentsFunc;
  }
  get add() {
    return this.#engine.addFunc;
  }
  get remove() {
    return this.#engine.removeFunc;
  }
  get get() {
    return this.#engine.getFunc;
  }
}
