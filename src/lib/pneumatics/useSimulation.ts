import { useCallback, useEffect, useRef, useState } from "react";
import { solveCircuit, stepCounters, stepStrokes, stepTimers } from "./engine";
import type { Circuit, RuntimeState, SolveResult } from "./types";

const emptyRuntime = (): RuntimeState => ({
  strokes: {},
  signals: {},
  valvePositions: {},
  timers: {},
  timerElapsed: {},
  counts: {},
  countEdges: {},
});

const emptySolve = (): SolveResult => ({
  pressurized: new Set(),
  vented: new Set(),
  conflicts: new Set(),
  actuated: {},
});

export function useSimulation(circuit: Circuit, running: boolean) {
  const [runtime, setRuntime] = useState<RuntimeState>(emptyRuntime);
  const [solved, setSolved] = useState<SolveResult>(emptySolve);
  const circuitRef = useRef(circuit);
  const runtimeRef = useRef(runtime);
  circuitRef.current = circuit;
  runtimeRef.current = runtime;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.05, (now - last) / 1000);
      last = now;

      const previous = runtimeRef.current;
      const result = solveCircuit(circuitRef.current, previous);
      const timing = stepTimers(circuitRef.current, previous, result, deltaSeconds);
      const counting = stepCounters(circuitRef.current, previous, result);
      const next: RuntimeState = {
        ...previous,
        strokes: stepStrokes(circuitRef.current, previous, result, deltaSeconds),
        valvePositions: result.actuated,
        timers: timing.timers,
        timerElapsed: timing.timerElapsed,
        counts: counting.counts,
        countEdges: counting.countEdges,
      };

      runtimeRef.current = next;
      setRuntime(next);
      setSolved(result);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  useEffect(() => {
    if (running) return;
    const result = solveCircuit(circuit, runtime);
    setSolved(result);
  }, [running, circuit, runtime]);

  const updateRuntime = useCallback((updater: (previous: RuntimeState) => RuntimeState) => {
    setRuntime((previous) => {
      const next = updater(previous);
      runtimeRef.current = next;
      return next;
    });
  }, []);

  const setSignal = useCallback(
    (id: string, value: boolean) => {
      updateRuntime((previous) => ({
        ...previous,
        signals: { ...previous.signals, [id]: value },
      }));
    },
    [updateRuntime],
  );

  const toggleSignal = useCallback(
    (id: string) => {
      updateRuntime((previous) => ({
        ...previous,
        signals: { ...previous.signals, [id]: !previous.signals[id] },
      }));
    },
    [updateRuntime],
  );

  const setStroke = useCallback(
    (id: string, value: number) => {
      updateRuntime((previous) => ({
        ...previous,
        strokes: { ...previous.strokes, [id]: value },
      }));
    },
    [updateRuntime],
  );

  const reset = useCallback(() => {
    const next = emptyRuntime();
    runtimeRef.current = next;
    setRuntime(next);
    setSolved(emptySolve());
  }, []);

  return { runtime, solved, setSignal, toggleSignal, setStroke, reset };
}