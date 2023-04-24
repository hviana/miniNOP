/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

import HistoryGraph from "./HistoryGraph.ts";

import { ExpAlgMode, ID, NOPNotification, SearchFunc } from "./ts/types.ts";

export default class SearchAlg {
  static async *notXHistory(
    graph: HistoryGraph,
    n: NOPNotification,
    func: SearchFunc,
    mode: ExpAlgMode,
  ): AsyncGenerator<NOPNotification> {
    graph.add(n);
    yield* SearchAlg.xHistory(graph, n, func, mode);
    graph.remove(n);
  }

  /**
   * @param {graph} HistoryGraph, can be accessed by NotifyingHolon.history.
   * @param {n} NOPNotification, the notification to be explained.
   * @param {func} function, (n:NOPNotification)=>boolean that selects search breakpoints and returns them as results.
   * @param {mode} ExpAlgMode, "SEARCH" | "PAST" | "AFTER".
   * @returns {*NOPNotification} iterable result where each iteration has an notification representing an explanation step.
   */
  static async *xHistory(
    graph: HistoryGraph,
    n: NOPNotification,
    func: SearchFunc,
    mode: ExpAlgMode,
  ): AsyncGenerator<NOPNotification> {
    const ex: Set<NOPNotification> = new Set();
    switch (mode) {
      case "SEARCH":
        yield* SearchAlg.depthS(graph, n, ex, func);
        break;
      case "PAST":
      case "AFTER":
        yield* SearchAlg.others(graph, n, func, mode);
        break;
    }
  }
  static async *depthS(
    graph: HistoryGraph,
    n: NOPNotification,
    ex: Set<NOPNotification>,
    func: SearchFunc,
  ): AsyncGenerator<NOPNotification> {
    if (await func(n)) {
      yield n;
    } else {
      for (const origin of graph.parents(n.from as ID)) {
        const c = (await graph.get(origin, n.from, 1, n.activationTime, 0))[0];
        if (!ex.has(c)) {
          ex.add(c);
          yield* SearchAlg.depthS(graph, c, ex, func);
        }
      }
    }
  }
  static async *others(
    graph: HistoryGraph,
    n: NOPNotification,
    func: SearchFunc,
    mode: ExpAlgMode,
  ): AsyncGenerator<NOPNotification> {
    if (mode === "AFTER") {
      var c: NOPNotification = n;
      while (c) {
        c = (await graph.get(c.from, c.to, 1, c.activationTime, 0))[0];
        if (await func(c)) {
          yield c;
        }
      }
    } else if (mode === "PAST") {
      var c: NOPNotification = n;
      while (c) {
        c = (await graph.get(c.from, c.to, 1, 0, c.activationTime))[0];
        if (await func(c)) {
          yield c;
        }
      }
    }
  }
}
