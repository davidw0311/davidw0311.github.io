"use client";

import { useMemo, useState } from "react";
import { masterySections, unmasteredScenarios } from "@/data/blackjackModes";
import {
  scenariosForSelection,
  trainingScenarios,
  type BlackjackAction,
  type HandKind,
  type TrainingScenario,
} from "@/data/blackjackStrategy";
import {
  initialTrainingScenario,
  nextTrainingScenario,
  trainingActionIsAvailable,
  type TrainerScreen,
  type TrainingFocus,
} from "@/data/blackjackTraining";

export function useBlackjackTraining() {
  const [screen, setScreen] = useState<TrainerScreen>("menu");
  const [focus, setFocus] = useState<TrainingFocus>("all");
  const [tableKind, setTableKind] = useState<HandKind>("hard");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(() => new Set());
  const [activePracticeIds, setActivePracticeIds] = useState<Set<string> | null>(null);
  const [scenario, setScenario] = useState<TrainingScenario>(initialTrainingScenario);
  const [selectedAction, setSelectedAction] = useState<BlackjackAction | null>(null);
  const [dealNumber, setDealNumber] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [masterySectionIndex, setMasterySectionIndex] = useState(0);
  const [masteredScenarioIds, setMasteredScenarioIds] = useState<Set<string>>(() => new Set());
  const [masteryAttempts, setMasteryAttempts] = useState(0);
  const [masterySectionComplete, setMasterySectionComplete] = useState(false);

  const isCorrect = selectedAction === scenario.correctAction;
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const currentMasterySection = masterySections[masterySectionIndex];
  const activePracticeScenarios = useMemo(() => {
    if (!activePracticeIds) return [];
    return trainingScenarios.filter((candidate) => activePracticeIds.has(candidate.id));
  }, [activePracticeIds]);
  const tableScenarios = useMemo(() => scenariosForSelection({ kind: tableKind }), [tableKind]);
  const tableRows = useMemo(() => {
    const rows = new Map<string, TrainingScenario[]>();
    for (const candidate of tableScenarios) {
      const row = rows.get(candidate.handLabel) ?? [];
      row.push(candidate);
      rows.set(candidate.handLabel, row);
    }
    return [...rows.values()];
  }, [tableScenarios]);

  const resetStats = () => {
    setAnswered(0);
    setCorrect(0);
    setStreak(0);
  };

  const dealFrom = (candidates: readonly TrainingScenario[]) => {
    const next = nextTrainingScenario(candidates, scenario.id);
    if (!next) return;
    setScenario(next);
    setSelectedAction(null);
    setDealNumber((value) => value + 1);
  };

  const dealPractice = (nextFocus: TrainingFocus = focus) => {
    const candidates = nextFocus === "all"
      ? trainingScenarios
      : nextFocus === "custom"
        ? activePracticeScenarios
        : trainingScenarios.filter((candidate) => candidate.kind === nextFocus);
    dealFrom(candidates);
  };

  const startMastery = () => {
    setScreen("mastery");
    setMasterySectionIndex(0);
    setMasteredScenarioIds(new Set());
    setMasteryAttempts(0);
    setMasterySectionComplete(false);
    resetStats();
    dealFrom(masterySections[0].scenarios);
  };

  const startPractice = () => {
    setScreen("practice");
    setFocus("all");
    setActivePracticeIds(null);
    resetStats();
    dealFrom(trainingScenarios);
  };

  const changeFocus = (nextFocus: Exclude<TrainingFocus, "custom">) => {
    setActivePracticeIds(null);
    setFocus(nextFocus);
    dealPractice(nextFocus);
  };

  const toggleSelection = (candidates: readonly TrainingScenario[]) => {
    setSelectedScenarioIds((current) => {
      const next = new Set(current);
      const remove = candidates.every((candidate) => next.has(candidate.id));
      for (const candidate of candidates) {
        if (remove) next.delete(candidate.id);
        else next.add(candidate.id);
      }
      return next;
    });
  };

  const startSelectedPractice = () => {
    const candidates = trainingScenarios.filter((candidate) => selectedScenarioIds.has(candidate.id));
    if (candidates.length === 0) return;
    setActivePracticeIds(new Set(selectedScenarioIds));
    setFocus("custom");
    setScreen("practice");
    resetStats();
    dealFrom(candidates);
  };

  const chooseAction = (action: BlackjackAction) => {
    if (selectedAction || !trainingActionIsAvailable(action, scenario)) return;
    const answerIsCorrect = action === scenario.correctAction;
    setSelectedAction(action);
    setAnswered((value) => value + 1);
    if (answerIsCorrect) {
      setCorrect((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }

    if (screen === "mastery") {
      setMasteryAttempts((value) => value + 1);
      if (answerIsCorrect) {
        setMasteredScenarioIds((current) => {
          const next = new Set(current);
          next.add(scenario.id);
          if (next.size === currentMasterySection.scenarios.length) setMasterySectionComplete(true);
          return next;
        });
      }
    }
  };

  const nextMasteryHand = () => {
    dealFrom(unmasteredScenarios(currentMasterySection, masteredScenarioIds));
  };

  const advanceMasterySection = () => {
    if (masterySectionIndex === masterySections.length - 1) {
      setScreen("menu");
      return;
    }
    const nextIndex = masterySectionIndex + 1;
    setMasterySectionIndex(nextIndex);
    setMasteredScenarioIds(new Set());
    setMasteryAttempts(0);
    setMasterySectionComplete(false);
    dealFrom(masterySections[nextIndex].scenarios);
  };

  return {
    accuracy,
    advanceMasterySection,
    answered,
    changeFocus,
    chooseAction,
    clearSelection: () => setSelectedScenarioIds(new Set()),
    correct,
    currentMasterySection,
    dealNumber,
    dealPractice,
    focus,
    isCorrect,
    masteredScenarioIds,
    masteryAttempts,
    masterySectionComplete,
    masterySectionIndex,
    nextMasteryHand,
    scenario,
    screen,
    selectedAction,
    selectedScenarioIds,
    setScreen,
    setTableKind,
    startMastery,
    startPractice,
    startSelectedPractice,
    streak,
    tableKind,
    tableRows,
    toggleSelection,
  };
}
