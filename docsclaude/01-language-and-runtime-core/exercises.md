# Module 01 Exercises: Language and Runtime Core

Perform these drills to verify your core runtime mental model. Predict your outputs *before* running the code.

---

## Exercise 1: Event Loop and Microtask Scheduling (Predict-Then-Run)

### The Problem
Predict the exact chronological console log output sequence of the following asynchronous code block:

```ts
// Illustrative — execute in scratch file
console.log('1: Main Start');

setTimeout(() => {
  console.log('2: Timer Callback');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('3: Promise microtask 1');
    return Promise.resolve();
  })
  .then(() => {
    console.log('4: Promise microtask 2');
  });

process.nextTick(() => {
  console.log('5: nextTick Callback');
});

console.log('6: Main End');
```

---

## Exercise 2: Closure Capture and Reference Stability

### The Problem
Review the following object factories. Predict what will be logged when calling `logger.log()` twice:

```ts
// Illustrative — execute in scratch file
function createCounterLogger() {
  let count = 0;
  return {
    increment: () => {
      count++;
    },
    log: () => {
      console.log(`Current Count: ${count}`);
    }
  };
}

const logger = createCounterLogger();
logger.increment();
const secondaryRef = logger;
secondaryRef.increment();
logger.log();
```

---

## Exercise 3: Branded Nominal Key Mappings

### The Problem
Explain why the following type configuration will throw a compilation error, and refactor it to compile correctly while preserving type branding:

```ts
// Illustrative
type Brand<K, T> = K & { __brand: T };
type TicketId = Brand<string, 'TicketId'>;
type UserId = Brand<string, 'UserId'>;

const myTicketId = 'tkt_100' as TicketId;
let rawString: string = 'some-string';

// Fix this code so it fails compilation if we assign a UserId to myTicketId:
let myUser: UserId = myTicketId as any; 
```

---

## Self-Grading Rubric

For each exercise, score yourself honestly from **0 to 3**:

- **0 (Unable to Attempt):** Did not understand the core concept or couldn't start.
- **1 (Partial Understanding):** Off on specific details (e.g. predicted `Timer Callback` before `Promise microtask 1` in Exercise 1).
- **2 (Correct with Refactoring):** Arrived at the correct output but had to run the code to verify or edit syntax to get it working.
- **3 (Flawless Execution):** Correctly predicted the output immediately with a clear explanation of *why* the runtime handled it that way.
