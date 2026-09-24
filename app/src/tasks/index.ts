/* Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Публичный API модуля задач: реестр, состояние, проверка решений.
export type {
  InitTaskValidationOptions,
  TaskDef,
  TaskDifficulty,
  TaskId,
  ValidationResult,
} from "./types";
export { tasks } from "./registry";
export {
  getActiveDifficulty,
  getActiveTask,
  getFirstUnsolvedTask,
  getNextTaskId,
  getPrevTaskId,
  isSolved,
  setActiveDifficulty,
} from "./state";
export { initTaskValidation, setActiveTask, syncTaskProgress } from "./validation";
