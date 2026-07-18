"use client";

import { useReducer, useCallback } from "react";

// ── Types ──

export type GamePhase = "select" | "betting" | "drawing" | "result";
export type DrawSubPhase = "ready" | "rolling" | "complete";
export type SidePanelView = "stats" | "tasks" | "history" | null;

export interface DrawState {
  revealed: number[];
  revealedZones: ("front" | "back")[];
  current: number | null;
  currentZone: "front" | "back" | null;
  currentPosition: number;
  drawNumbers: { front: number[]; back: number[] } | null;
}

export interface LastGameResult {
  tickets: Array<{
    front: number[];
    back: number[];
    matched_front: number;
    matched_back: number;
    prize: Record<string, unknown> | null;
  }>;
  totalWin: number;
  netResult: number;
  settled: boolean;
}

export interface GameState {
  phase: GamePhase;
  drawSubPhase: DrawSubPhase;
  drawId: string;
  drawState: DrawState;
  lastResult: LastGameResult | null;
  sidePanel: SidePanelView;
  error: string | null;
  expiresIn: number;
}

// ── Actions ──

export type GameAction =
  | { type: "BET_START" }
  | { type: "BET_COMPLETE"; drawId: string; expiresIn: number }
  | { type: "BET_ERROR"; error: string }
  | { type: "ROLL_RESULT"; number: number; zone: "front" | "back"; isLast: boolean }
  | { type: "ROLL_COMPLETE"; result: LastGameResult; drawNumbers: { front: number[]; back: number[] } }
  | { type: "ROLL_ERROR"; error: string }
  | { type: "AUTO_ROLL_START" }
  | { type: "RECOVER_STATE"; state: Partial<GameState> }
  | { type: "NEW_GAME" }
  | { type: "RESET_PHASE" }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_SIDE_PANEL"; view: SidePanelView }
  | { type: "TICK_EXPIRES" };

// ── Initial ──

const initialDrawState: DrawState = {
  revealed: [],
  revealedZones: [],
  current: null,
  currentZone: null,
  currentPosition: 0,
  drawNumbers: null,
};

export const initialGameState: GameState = {
  phase: "select",
  drawSubPhase: "ready",
  drawId: "",
  drawState: initialDrawState,
  lastResult: null,
  sidePanel: null,
  error: null,
  expiresIn: 180,
};

// ── Reducer ──

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "BET_START":
      return { ...state, phase: "betting", error: null };

    case "BET_COMPLETE":
      return {
        ...state,
        phase: "drawing",
        drawSubPhase: "ready",
        drawId: action.drawId,
        drawState: initialDrawState,
        lastResult: null,
        expiresIn: action.expiresIn,
        error: null,
      };

    case "BET_ERROR":
      return { ...state, phase: "select", error: action.error };

    case "ROLL_RESULT": {
      const { number, zone, isLast } = action;
      const newRevealed = [...state.drawState.revealed, number];
      const newZones = [...state.drawState.revealedZones, zone];
      return {
        ...state,
        phase: "drawing",
        drawSubPhase: isLast ? "complete" : "rolling",
        drawState: {
          ...state.drawState,
          revealed: newRevealed,
          revealedZones: newZones,
          current: number,
          currentZone: zone,
          currentPosition: state.drawState.currentPosition + 1,
        },
      };
    }

    case "ROLL_COMPLETE":
      return {
        ...state,
        phase: "result",
        drawSubPhase: "complete",
        drawState: {
          ...state.drawState,
          drawNumbers: action.drawNumbers,
        },
        lastResult: action.result,
      };

    case "ROLL_ERROR":
      return { ...state, drawSubPhase: "ready", error: action.error };

    case "AUTO_ROLL_START":
      return { ...state, drawSubPhase: "rolling" };

    case "RECOVER_STATE":
      return { ...state, ...action.state };

    case "NEW_GAME":
      return {
        ...initialGameState,
        sidePanel: state.sidePanel,
        expiresIn: 180,
      };

    case "RESET_PHASE":
      return {
        ...state,
        phase: "select",
        drawSubPhase: "ready",
        drawId: "",
        drawState: initialDrawState,
        lastResult: null,
        error: null,
      };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "SET_SIDE_PANEL":
      return { ...state, sidePanel: action.view };

    case "TICK_EXPIRES":
      return { ...state, expiresIn: Math.max(0, state.expiresIn - 1) };

    default:
      return state;
  }
}

// ── Hook ──

export function useGameMachine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const betStart = useCallback(() => dispatch({ type: "BET_START" }), []);
  const betComplete = useCallback(
    (drawId: string, expiresIn: number) =>
      dispatch({ type: "BET_COMPLETE", drawId, expiresIn }),
    []
  );
  const betError = useCallback((error: string) => dispatch({ type: "BET_ERROR", error }), []);
  const rollResult = useCallback(
    (number: number, zone: "front" | "back", isLast: boolean) =>
      dispatch({ type: "ROLL_RESULT", number, zone, isLast }),
    []
  );
  const rollComplete = useCallback(
    (result: LastGameResult, drawNumbers: { front: number[]; back: number[] }) =>
      dispatch({ type: "ROLL_COMPLETE", result, drawNumbers }),
    []
  );
  const rollError = useCallback((error: string) => dispatch({ type: "ROLL_ERROR", error }), []);
  const autoRollStart = useCallback(() => dispatch({ type: "AUTO_ROLL_START" }), []);
  const recoverState = useCallback(
    (s: Partial<GameState>) => dispatch({ type: "RECOVER_STATE", state: s }),
    []
  );
  const newGame = useCallback(() => dispatch({ type: "NEW_GAME" }), []);
  const resetPhase = useCallback(() => dispatch({ type: "RESET_PHASE" }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: "SET_ERROR", error }), []);
  const setSidePanel = useCallback(
    (view: SidePanelView) => dispatch({ type: "SET_SIDE_PANEL", view }),
    []
  );
  const tickExpires = useCallback(() => dispatch({ type: "TICK_EXPIRES" }), []);

  // Computed shortcuts
  const isSelect = state.phase === "select";
  const isBetting = state.phase === "betting";
  const isDrawing = state.phase === "drawing";
  const isResult = state.phase === "result";
  const isRolling = state.drawSubPhase === "rolling";
  const isDrawReady = state.drawSubPhase === "ready";
  const isDrawComplete = state.drawSubPhase === "complete";

  return {
    ...state,
    // Computed
    isSelect,
    isBetting,
    isDrawing,
    isResult,
    isRolling,
    isDrawReady,
    isDrawComplete,
    // Actions
    betStart,
    betComplete,
    betError,
    rollResult,
    rollComplete,
    rollError,
    autoRollStart,
    recoverState,
    newGame,
    resetPhase,
    setError,
    setSidePanel,
    tickExpires,
  };
}
