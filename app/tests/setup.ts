/**
 * Глобальная настройка тестов.
 *
 * Выполняется один раз перед тестами:
 * 1. Полифиллит DOMParser/XMLSerializer из @xmldom/xmldom — Blockly.Xml.textToDom
 *    ищет их на globalThis (в браузере они встроенные).
 * 2. Применяет русскую локаль Blockly и кастомные сообщения (ADD_TEXT_COLOR и др.),
 *    чтобы блочные определения из src/blocks/text.ts корректно инициализировались.
 * 3. Регистрирует стандартные блоки Blockly и кастомные блоки проекта.
 */
import * as Blockly from "blockly";
import "blockly/blocks";
import * as RuLocale from "blockly/msg/ru";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

import { blocks as textBlocks } from "../src/blocks/text";
import { blocks as algorithmBlocks } from "../src/blocks/algorithms";

// 1. Полифилл XML API в Node (Blockly ожидает их в globalThis)
(globalThis as any).DOMParser = DOMParser;
(globalThis as any).XMLSerializer = XMLSerializer;

// 2. Локаль и кастомные сообщения для блока add_text и др.
Blockly.setLocale(RuLocale as unknown as Record<string, unknown>);
const msg = (Blockly as any).Msg || {};
msg.ADD_TEXT_COLOR = "Добавить текст %1 цвет %2";
msg.ADD_TEXT = "Добавить текст %1";

// 3. Регистрация блоков проекта
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(algorithmBlocks);
