class Observable {
  constructor(subscribe) {
    this._subscribe = subscribe;
  }
  subscribe(observer){
    return this._subscribe(observer);
  }
  
  retry(num) {
    const self = this;
    return new Observable(function subscribe(observer) {
      let currentSub = null;
      const processRequest = (currentAttemptNumber) => {
        currentSub = self.subscribe({
          next(v) {
            observer.next(v);
          },
          complete() {
            observer.complete();
          },
          error(err) {
            if (currentAttemptNumber === 0) {
              observer.error(err);
            }
            else {
              processRequest(currentAttemptNumber - 1);
            }
          }
        });
      };
      
      processRequest(num);
      
      return {
        unsubscribe() {
          currentSub.unsubscribe();
        }
      };
      
    });
  }
  
  static concat(...observables) {
    return new Observable(function subscribe(observer) {
      let myObservables = observables.slice();
      let currentSub = null;
      
      let processObservable = () => {
        if (myObservables.length === 0) {
          observer.complete();
        }
        else {
          let observable = myObservables.shift();
          currentSub = observable.subscribe({
            next(v) {
              observer.next(v)
            },
            error(err) {
              observer.error(err);
              currentSub.unsubscribe();
            },
            complete() {
              processObservable();
            }
          });
        }
      };
      processObservable();
      
      return {
        unsubscribe() { currentSub.unsubscribe(); }
      }
    });
  }
  
  static of(value) {
    return new Observable(function subscribe(observer) {
      observer.next(value);
      observer.complete();
      return {
        unsubscribe() { }
      };
    })
  }
  
  static timeout(time) {
    return new Observable(function subscribe(observer) {
      console.log("CALLING SETTIMEOUT")
      const handle = setTimeout(function() {
        observer.next();
        observer.complete();
      }, time);
      
      return {
        unsubscribe() {
          clearTimeout(handle);
        }
      };
    });
  }
  
  static fromEvent(dom, eventName) {
    return new Observable(function subscribe(observer) {
      const handler = ev => {
        observer.next(ev)
      };
      dom.addEventListener(eventName, handler);
      
      return {
        unsubscribe() {
          dom.removeEventListener(eventName, handler)
        }
      }
    })
  }
  
  map(projection) {
    const self = this;
    return new Observable(function subscribe(observer) {
      const subscription = self.subscribe({
        next(v) {
          observer.next(projection(v));
        },
        error(err) {
          observer.error(err);
        },
        complete() {
          observer.complete();
        }
      });
      
      return subscription;
    });
  }
  
  filter(predicate) {
    const self = this;
    return new Observable(function subscribe(observer) {
      const subscription = self.subscribe({
        next(v) {
          if (predicate(v)) {
            observer.next(v);
          }
        },
        error(err) {
          observer.error(err);
        },
        complete() {
          observer.complete();
        }
      });
      
      return subscription;
    });
  }
  
  share() {
    const subject = new Subject();
    this.subscribe(subject);
    return subject;
  }
  
  observeOn(scheduler) {
    const self = this;
    return new Observable(function subscribe(observer){
      return self.subscribe({
        next(v) {
          scheduler(() => observer.next(v));
        },
        error(e) {
          scheduler(() => observer.error(v));
        },
        complete() {
          scheduler(() => observer.complete());
        }
      })
    });
  }
}


class Subject extends Observable {
  constructor() {
    super(function subscribe(observer) {
      const self = this;
      self.observers.add(observer);
      
      return {
        unsubscribe() {
          self.observers.delete(observer);
        }
      }
    });
    
    this.observers = new Set();
  }
  
  next(v) {
    for(let observer of [...this.observers]) {
      observer.next(v);
    }
  }
  
  error(v) {
    for(let observer of [...this.observers]) {
      observer.error(v);
    }
  }
  
  complete(v) {
    for(let observer of [...this.observers]) {
      observer.complete();
    }
  }
}

/*
const button = document.getElementById("button");

const clicks = Observable.fromEvent(button, "click");
debugger;
clicks.
  map(ev => ev.offsetX).
  filter(offsetX => offsetX > 10).
  subscribe({
    next(ev) {
      console.log(ev);
    },
    complete() {
      console.log("done");
    }
  });

*/
debugger;
/*
const timeout = Observable.timeout(500).share()

timeout.subscribe({
  next(v) {
    console.log(v);
  },
  complete() {
    console.log("done")
  }
});

timeout.subscribe({
  next(v) {
    console.log(v);
  },
  complete() {
    console.log("done")
  }
});
*/

Observable.of(5).
observeOn(action => setTimeout(action,5000)).
subscribe({
  next(v) {
    console.log(v);
  },
  complete() {
    console.log("done");
  }
});