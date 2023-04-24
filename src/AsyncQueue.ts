/*
Created by: Henrique Emanoel Viana
Github: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

export default class AsyncQueue {
  #queue = Promise.resolve();
  add(operation: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.#queue = this.#queue
        .then(operation)
        .then(resolve)
        .catch(reject);
    });
  }
}
