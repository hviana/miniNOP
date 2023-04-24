/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

import {
  GraphEngine,
  HistoryEntryFunc,
  HistoryGetFunc,
  HistoryTraverseFunc,
  ID,
  InputMem,
  NOPNotification,
  NotifyingHolonParams,
  Path,
} from "./types.ts";

const defaultNotifyingHolonParams: NotifyingHolonParams = {
  //@ts-ignore
  f: (im: inputMem, data: { [key: Path]: any }) => im,
  diff: (val1: any, val2: any) => val1 != val2,
  outDiff: (val1: any, val2: any) => val1 != val2,
  pathsDiff: {},
  onNotification: (n: NOPNotification) => undefined,
};

//BEGIN DEFAULT GRAPH ENGINE
const graphMap: Map<
  (null | ID),
  Map<(null | ID), NOPNotification[]>
> = new Map();
const reverseMap: Map<(null | ID), Set<(null | ID)>> = new Map();

const defaultHistoryChildsFunc: HistoryTraverseFunc = (
  id: ID,
): ID[] => {
  if (!graphMap.get(id)) {
    graphMap.set(id, new Map());
  }
  return [...graphMap.get(id)!.keys()] as ID[];
};
const defaultHistoryParentsFunc: HistoryTraverseFunc = (
  id: ID,
): ID[] => {
  if (!reverseMap.get(id)) {
    reverseMap.set(id, new Set());
  }
  return [...reverseMap.get(id)!] as ID[];
};

const ensurePath = (
  from: null | ID,
  to: null | ID,
): void => {
  if (!graphMap.get(from)) {
    graphMap.set(from, new Map());
  }
  if (!graphMap.get(from)!.get(to)) {
    graphMap.get(from)!.set(to, []);
  }
  if (!reverseMap.get(to)) {
    reverseMap.set(to, new Set());
  }
  if (!reverseMap.get(to)!.has(from)) {
    reverseMap.get(to)!.add(from);
  }
};
const hasPath = (
  from: null | ID,
  to: null | ID,
): boolean => {
  if (!graphMap.get(from)) {
    return false;
  }
  if (!graphMap.get(from)!.get(to)) {
    return false;
  }
  return true;
};

const defaultHistoryEntryFunc: HistoryEntryFunc = (
  n: NOPNotification,
): void => {
  ensurePath(n.from, n.to);
  const arr = graphMap.get(n.from)!.get(n.to)!;
  var i = 0;
  while (i < arr.length) {
    if (n.time > arr[i].time) {
      break;
    } else {
      i++;
    }
  }
  arr.splice(i, 0, n);
};
const defaultHistoryRemoveEntryFunc: HistoryEntryFunc = (
  n: NOPNotification,
): void => {
  if (!hasPath(n.from, n.to)) {
    return;
  }
  const arr = graphMap.get(n.from)!.get(n.to)!;
  const i = arr.indexOf(n);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const defaultHistoryGetFunc: HistoryGetFunc = (
  from: null | ID,
  to: null | ID,
  limit: number = 0,
  startTime: number = 0,
  endTime: number = 0,
): NOPNotification[] => {
  const res: NOPNotification[] = [];
  if (!hasPath(from, to)) {
    return res;
  }
  const arr = graphMap.get(from)!.get(to)!;
  for (const n of arr) {
    if ((startTime > 0) && (n.time > startTime)) {
      continue;
    } else if ((endTime > 0) && (n.time < endTime)) {
      break;
    } else {
      res.push(n);
      if ((limit > 0) && (res.length >= limit)) {
        break;
      }
    }
  }
  return res;
};
const defaultGraphEngine: GraphEngine = {
  addFunc: defaultHistoryEntryFunc,
  removeFunc: defaultHistoryRemoveEntryFunc,
  getFunc: defaultHistoryGetFunc,
  childsFunc: defaultHistoryChildsFunc,
  parentsFunc: defaultHistoryParentsFunc,
};

//END DEFAULT GRAPH ENGINE

export { defaultGraphEngine, defaultNotifyingHolonParams };
