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
