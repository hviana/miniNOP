/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

export type NotificationMode =
  | "RENOTIFICATION"
  | "WEAK"
  | "STRONG";

export type ID = string;

export type Path = string;

export type InputMem = { [key: Path]: any };

export type F = (
  im: InputMem,
  data: { [key: string]: any },
) => void | Promise<void>;
export type Diff = (val1: any, val2: any) => boolean | Promise<boolean>;
export type OnNotification = (n: NOPNotification) => void | Promise<void>;

export type NotifyingHolonParams = {
  f?: F;
  diff?: Diff;
  outDiff?: Diff;
  pathsDiff?: {
    [key: Path]: Diff;
  };
  initialInputMem?: InputMem;
  initialOutMem?: any;
  onNotification?: OnNotification;
  id?: ID;
};

export type HistoryEntryFunc = (n: NOPNotification) => void | Promise<void>;

export type HistoryGetFunc = (
  from: ID | null,
  to: ID | null,
  limit: number,
  startTime: number,
  endTime: number,
) => NOPNotification[] | Promise<NOPNotification[]>;

export type HistoryTraverseFunc = (
  id: ID,
) => ID[];

export type GraphEngine = {
  addFunc: HistoryEntryFunc;
  removeFunc: HistoryEntryFunc;
  getFunc: HistoryGetFunc;
  childsFunc: HistoryTraverseFunc;
  parentsFunc: HistoryTraverseFunc;
};

export type SearchFunc = (n: NOPNotification) => boolean | Promise<boolean>;

export type ExpAlgMode = "SEARCH" | "PAST" | "AFTER";

export type Connection = Map<ID, Map<Path, NotificationMode[]>>;

export type NOPNotification = {
  id?: ID;
  from: ID | null;
  to: ID | null;
  path: Path;
  value: any;
  modes: NotificationMode[];
  time: number;
  activationTime: number;
};
