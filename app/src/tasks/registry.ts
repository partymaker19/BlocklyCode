// Реестр всех задач: объединяет группы. Полнота покрытие TaskId
// проверяется компилятором: не хватится любой id — ошибка типов.
import type { TaskRegistry } from "./types";
import { outputTasks } from "./output";
import { variablesTasks } from "./variables";
import { conditionsTasks } from "./conditions";
import { loopsTasks } from "./loops";
import { listsTasks } from "./lists";
import { functionsTasks } from "./functions";
import { advancedTasks } from "./advanced";

export const tasks: TaskRegistry = {
  ...outputTasks,
  ...variablesTasks,
  ...conditionsTasks,
  ...loopsTasks,
  ...listsTasks,
  ...functionsTasks,
  ...advancedTasks,
};
