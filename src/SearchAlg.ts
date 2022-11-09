/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/site/henriqueemanoelviana
cel: +55 (41) 99999-4664
*/

import HistoryGraph from "./HistoryGraph.ts";
import NotifyingCell from "./NotifyingCell.ts";

import { Event, SearchFunc } from "./ts/types.ts";

export default class SearchAlg {
  static *notXHistory(
    graph: HistoryGraph,
    fl: SearchFunc,
    e: Event,
  ): Generator<[Event[], Map<Event, Event[]>]> {
    NotifyingCell.history.add(e);
    yield* SearchAlg.xHistory(graph, fl, e);
    NotifyingCell.history.remove(e);
  }

  /**
   * @param {graph} HistoryGraph, can be accessed by NotifyingCell.history.
   * @param {fl} function, (n:Event)=>boolean that selects search breakpoints and returns them as results. It has as input a notification and parameters of labels can be used.
   * @param {e} Event, notification representing the event to be explained.
   * @returns {*[Event[],Map<Event,Event[]>]} iterable result where each iteration has an array of notifications representing an explanation step and a map containing the path traversed for each notification.
   */
  static *xHistory(
    graph: HistoryGraph,
    fl: SearchFunc,
    e: Event,
  ): Generator<[Event[], Map<Event, Event[]>]> {
    const paths: Map<Event, Event[]> = new Map([[e, [e]]]);
    var list: Event[] = [e];
    const ex: Set<Event> = new Set();
    while (list.length > 0) {
      list.sort((a: Event, b: Event): number => b.time - a.time);
      yield [list, paths];
      list = SearchAlg.continueS(graph, list, paths, ex, fl);
    }
  }
  static depthS(
    graph: HistoryGraph,
    list: Event[],
    paths: Map<Event, Event[]>,
    path: Event[],
    ex: Set<Event>,
    fl: SearchFunc,
    e: Event,
    d: boolean,
    r: number,
  ): void {
    if ((fl(e, path) || d) && (r > 0)) {
      list.unshift(e);
      paths.set(e, [...path, e]);
    } else {
      for (const origin of graph.parents(e.from)) {
        const c = graph.get(origin, e.from, 1, e.activationTime);
        if (!ex.has(c)) {
          ex.add(c);
          SearchAlg.depthS(graph, list, paths, path, ex, fl, c, d, r + 1);
        }
      }
    }
  }
  static continueS(
    graph: HistoryGraph,
    list: Event[],
    paths: Map<Event, Event[]>,
    ex: Set<Event>,
    fl: SearchFunc,
  ): Event[] {
    var nlist: Event[] = [];
    var next: Event;
    while (next = list.pop()) {
      var reqMoreExp: boolean = confirm(
        `Want more explanation about event ${next}?`,
      );
      if (reqMoreExp) {
        var d: boolean = confirm(
          `Do you want this explanation to be detailed?`,
        );
        SearchAlg.depthS(
          graph,
          nlist,
          paths,
          paths.get(next),
          ex,
          fl,
          next,
          d,
          0,
        );
      }
    }
    return nlist;
  }
}
