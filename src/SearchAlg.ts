/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/site/henriqueemanoelviana
cel: +55 (41) 99999-4664
*/

import HistoryGraph from "./HistoryGraph.ts";
import NotifyingCell from "./NotifyingCell.ts";

import { ExpAlgMode, NOPNotification, SearchFunc } from "./ts/types.ts";

export default class SearchAlg {
  static *notXHistory(
    graph: HistoryGraph,
    n: NOPNotification,
    func: SearchFunc,
    mode: ExpAlgMode,
  ): Generator<NOPNotification> {
    NotifyingCell.history.add(n);
    yield* SearchAlg.xHistory(graph, n, func, mode);
    NotifyingCell.history.remove(n);
  }

  /**
   * @param {graph} HistoryGraph, can be accessed by NotifyingCell.history.
   * @param {n} NOPNotification, the notification to be explained.
   * @param {func} function, (n:NOPNotification)=>boolean that selects search breakpoints and returns them as results. It has as input a notification and parameters of symbols can be used.
   * @param {mode} ExpAlgMode, "SEARCH" | "PAST" | "AFTER".
   * @returns {*NOPNotification} iterable result where each iteration has an notification representing an explanation step.
   */
  static *xHistory(
    graph: HistoryGraph,
    n: NOPNotification,
    func: SearchFunc,
    mode: ExpAlgMode,
  ): Generator<NOPNotification> {
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
  static *depthS(
    graph: HistoryGraph,
    n: NOPNotification,
    ex: Set<NOPNotification>,
    func: SearchFunc,
  ): Generator<NOPNotification> {
    if (func(n)) {
      yield n;
    } else {
      for (const origin of graph.parents(n.from)) {
        const c = graph.get(origin, n.from, 1, n.activationTime);
        if (!ex.has(c)) {
          ex.add(c);
          yield* SearchAlg.depthS(graph, c, ex, func);
        }
      }
    }
  }
  static *others( //TODO
    graph: HistoryGraph,
    n: NOPNotification,
    func: SearchFunc,
    mode: ExpAlgMode,
  ): Generator<NOPNotification> {
    for (const origin of graph.parents(n.from)) { //TODO
      const c = graph.get(origin, n.from, 1, n.activationTime); //TODO
      if (func(n)) {
        yield c;
      }
    }
  }
}
