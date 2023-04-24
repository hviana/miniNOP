# miniNOP

A framework for Notification Oriented Paradigm (NOP[[1]](#1)) implemented in
TypeScript.

In the Notification Oriented Paradigm (NOP), there are the "factual and causal
smart-entities named as Fact Base Elements (FBEs) and Rules that are related to
another collaborative notifier smart-entities. Each FBE is related to Attributes
and Methods, whereas each Rule to Premises-Conditions and Actions-Instigations.
All these entities collaboratively carry out the inference process using
Notifications, providing solutions to deficiencies of current paradigms"
[[1]](#1).

The NOP, in addition to avoiding temporal and structural code redundancies
through notifications, has a defined inference model composed of entities with
specific functions. In this framework, an alternative core is used that does not
define an inference flow or specific entities, there are only notifying holons
and these notify each other. The notifying holon is a structure capable of
detecting and notifying changes in its state, delegating only the responsibility
of constructing the outgoing notification for a function type parameter. In this
way, the original NOP core can be built on top of this core. This framework can
be understood as a minimal core approach.

## Contents

- [Sample application](#sample-application)
- [Possibilities with notifying holons](#possibilities-with-notifying-holons)
  - [Chain operations](#chain-operations)
  - [Custom inequality operator](#custom-inequality-operator)
  - [Search the history graph](#search-the-history-graph)
- [Instructions to run this project](#instructions-to-run-this-project)
- [References](#references)
- [About](#about)

## Sample application

The example below describes a notifying holons that performs a sum.

```typescript
import { NotifyingHolon } from "https://raw.githubusercontent.com/hviana/miniNOP/master/mod.ts";

const sum = (im: any, data: any) => {
  var total = 0;
  for (const path in im) {
    total += im[path];
  }
  return total;
};
const log = (n: any) => console.log(n);
const sumHolon1 = new NotifyingHolon({
  f: sum,
  onNotification: log,
});
//will trigger an exit notification:
sumHolon1.receive({ val1: 1, val2: 3 });
//will not trigger an exit notification as 1+3=2+2:
sumHolon1.receive({ val1: 2, val2: 2 });
```

The `receive` method also has an optional second parameter named `modes`. If
`modes=["RENOTIFICATION"]`, the notification will force an exit notification
even if there is no change in holon state. If `modes=["WEAK"]`, in which the
notification updates the input memory of subsequent holons but does not trigger
activations. If `modes=["STRONG"]` an activation will be forced and `f` will be
reevaluated. It is possible to combine notification modes.

## Possibilities with notifying holons

### Chain operations

It is possible to add the output of one holon as input to another. In the
example below, the output of the holon sum of the example was added as input to
a holon that checks if this sum is greater than 5.

```typescript
//out(sumHolon1) > 5 ?
const biggerThan = (im: any, data: any) => {
  return im["left"] > im["right"];
};
const premiseHolon1 = new NotifyingHolon({
  f: biggerThan,
  onNotification: log,
  initialInputMem: { right: 5 }, //Also exists the initialOutMem parameter
});
sumHolon1.connect({ left: premiseHolon1 }); //There is an optional second parameter which is the connection notification modes. It is possible to connect a holon by referencing its id instead of its instance object.
```

### Custom inequality operator

It is possible to create a custom inequality operator to avoid excessively
unnecessary triggering of notifications. In the example below, it is considered
that the modulus of the difference of two values ​​must be greater than 1.

```typescript
const getVal = (im: any, data: any) => im["val1"]; //Just pass notification path "val1" as outgoing notification value
const relaxedDiff = (val1: any, val2: any) => {
  if (isNaN(val1) || isNaN(val2)) { //If one of the parameters is not numeric
    return true;
  }
  return Math.abs(val2 - val1) > 1;
};
const holon1 = new NotifyingHolon({
  f: getVal,
  diff: relaxedDiff,
  onNotification: log,
});
//will trigger an exit notification because the initial value of "val1" was not numeric (it was undefined):
holon1.receive({ val1: 1 });
//Will not trigger notification, because |2 - 1| > 1 gives false:
holon1.receive({ val1: 2 });
//Will trigger notification, because |3 - 1| > 1 gives true
holon1.receive({ val1: 3 });
```

In this context, it is also possible to explore the `outDiff` and `pathsDiff`
parameters. The `diff` parameter does not distinguish between input, output or
notification path. And it will be used if these other more specific parameters
are not found.

### Search the history graph

Saving notifications in a history:

```typescript
const graph = new HistoryGraph();
const holon1 = new NotifyingHolon({
  f: myDFunc,
  onNotification: (n: any) => graph.add(n),
});
```

There is an algorithm capable of exploring this graph, so that explanations
about notifications can be generated. It is possible to see the algorithm
parameters in the code below.

```typescript
  //class SearchAlg

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
  ): AsyncGenerator<NOPNotification>
```

## Instructions to run this project

Basically you just need to clone the project and install the Deno runtime.

```console
# clone project
git clone https://github.com/hviana/miniNOP.git
# enter the project directory
cd miniNOP
# install Deno (Mac, Linux)
curl -fsSL https://deno.land/install.sh | sh
# install Deno (Windows/PowerShell)
iwr https://deno.land/install.ps1 -useb | iex
# run project example:
deno run --unstable --allow-all example/main.ts
# run project example (web):
deno run --allow-all --unstable https://raw.githubusercontent.com/hviana/miniNOP/master/example/main.ts
# bundle miniNOP lib to any runtime or web browsers:
deno bundle mod.ts nop.js
# bundle miniNOP lib to any runtime or web browsers (web):
deno bundle https://raw.githubusercontent.com/hviana/miniNOP/master/mod.ts nop.js
```

## References

<a id="1">[1]</a> J. M. Simão, C. A. Tacla, P. C. Stadzisz and R. F.
Banaszewski, "Notification Oriented Paradigm (NOP) and Imperative Paradigm: A
Comparative Study," Journal of Software Engineering and Applications, Vol. 5 No.
6, 2012, pp. 402-416. doi: https://www.doi.org/10.4236/jsea.2012.56047

## About

Author: Henrique Emanoel Viana, a Brazilian computer scientist, enthusiast of
web technologies, cel: +55 (41) 99999-4664. URL:
https://sites.google.com/view/henriqueviana

Improvements and suggestions are welcome!
