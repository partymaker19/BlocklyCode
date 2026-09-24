// Типы и контракты реестра обучающих задач.
import * as Blockly from "blockly";

export type InitTaskValidationOptions = {
  checkButton: HTMLButtonElement | null;
  feedbackEl: HTMLDivElement | null;
  starsEl: HTMLDivElement | null;
  // Кнопка перехода к следующей задаче (опционально)
  nextButton?: HTMLButtonElement | null;
  // Кнопка перехода к предыдущей задаче (опционально)
  prevButton?: HTMLButtonElement | null;
};

export type ValidationResult = { ok: boolean; stars: number };

export type TaskId =
  | "hello_world"
  | "add_2_7"
  | "var_my_age"
  | "calc_sum"
  | "greet_concat"
  | "inc_counter"
  | "discount_calc"
  | "even_or_odd"
  | "time_of_day"
  | "first_loop"
  | "sum_1_to_n"
  | "guess_game"
  | "list_foreach"
  | "sublist_foreach"
  | "list_filter_even"
  | "list_filter_even_min_max"
  | "list_filter_even_avg"
  | "list_filter_even_median"
  | "list_sum_even_positions"
  | "list_sort_min_max"
  | "mult_table"
  | "first_even_break"
  | "first_function"
  | "function_with_param"
  | "function_return"
  | "first_condition"
  | "a1_number_analyzer"
  | "sum_array"
  | "min_max"
  | "char_freq";

export type TaskDifficulty = "basic" | "advanced";

export type TaskDef = {
  id: TaskId;
  difficulty: TaskDifficulty;
  title: (lang: "ru" | "en") => string;
  description: (lang: "ru" | "en") => string; // может содержать HTML
  hint: (lang: "ru" | "en") => string;
  validate: (
    ws: Blockly.WorkspaceSvg,
    outputLines: string[],
    lang?: "ru" | "en"
  ) => Promise<ValidationResult>;
};

export type TaskRegistry = Record<TaskId, TaskDef>;
