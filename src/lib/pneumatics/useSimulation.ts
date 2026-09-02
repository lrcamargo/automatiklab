import { useCallback, useEffect, useRef, useState } from "react";
import { solveCircuit, stepStrokes } from "./engine";
import type { Circuit, RuntimeState, SolveResult } from "./types";

const EMPTY: SolveResult = { pressurized: new Set(), actuated: {} };

export function useSimulation(circuit: Circuit, running: boolean) {
  const [runtime, setRuntime] = useState<RuntimeState>({ strokes: {}, signals: {} });
  const [solved, setSolved] = useState<SolveResult>(EMPTY);
  const circuitRef = useRef(circuit);
  circuitRef.current = circuit;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setRuntime((prev) => {
        const result = solveCircuit(circuitRef.current, prev);
        const strokes = stepStrokes(circuitRef.current, prev, result, dt);
        setSolved(result);
        return { ...prev, strokes };
      });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  useEffect(() => {
    if (running) return;
    setSolved(solveCircuit(circuit, runtime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, circuit]);

  const setSignal = useCallback((id: string, value: boolean) => {
    setRuntime((prev) => ({ ...prev, signals: { ...prev.signals, [id]: value } }));
  }, []);

  const toggleSignal = useCallback((id: string) => {
    setRuntime((prev) => ({ ...prev, signals: { ...prev.signals, [id]: !prev.signals[id] } }));
  }, []);

  /** move o cilindro para uma posição de curso (usado por interações válidas na bancada) */
  const setStroke = useCallback((id: string, value: number) => {
    setRuntime((prev) => ({ ...prev, strokes: { ...prev.strokes, [id]: value } }));
  }, []);


  const reset = useCallback(() => {
    setRuntime({ strokes: {}, signals: {} });
    setSolved(EMPTY);
  }, []);

  return { runtime, solved, setSignal, toggleSignal, reset };
}
