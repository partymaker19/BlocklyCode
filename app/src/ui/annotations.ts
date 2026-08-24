// Аннотации поверх рабочей области: кисть, линия, стрелка, прямоугольник (Konva).
// Модуль загружается лениво (динамический import в index.ts) при первом
// включении режима аннотаций — Konva не попадает в основной бандл.
import Konva from "konva";

type Tool = "brush" | "line" | "arrow" | "rect";

export class AnnotationManager {
  private overlay: HTMLDivElement;
  private toolbar: HTMLDivElement;
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;
  private tool: Tool = "brush";
  private color = "#ff2d55";
  private size = 4;
  private drawing = false;
  private points: number[] = [];
  private currentShape: Konva.Shape | null = null;
  private history: Konva.Shape[] = [];
  private redoStack: Konva.Shape[] = [];
  private _drawScheduled = false;

  constructor() {
    this.overlay = document.getElementById(
      "annotationOverlay",
    ) as HTMLDivElement;
    this.toolbar = document.getElementById("annotToolbar") as HTMLDivElement;
    this.initUI();
    this.initStage();
    window.addEventListener("resize", () => this.scheduleResize());
  }

  /** Публичный метод: открыть слой аннотаций (используется при ленивой загрузке). */
  openOverlay() {
    this.toggle(true);
  }

  private initUI() {
    const toggleBtn = document.getElementById(
      "annotateToggleBtn",
    ) as HTMLButtonElement | null;
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggle());
    }
    const map: Record<string, () => void> = {
      annotBrush: () => this.setTool("brush"),
      annotLine: () => this.setTool("line"),
      annotArrow: () => this.setTool("arrow"),
      annotRect: () => this.setTool("rect"),
      annotUndo: () => this.undo(),
      annotRedo: () => this.redo(),
      annotClear: () => this.clear(),
      annotColor: () => this.pickColor(),
      annotSize: () => this.pickSize(),
    };
    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", map[id]);
    });

    document.addEventListener("keydown", (e) => {
      if (this.overlay.style.display !== "block") return;
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.undo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.redo();
      }
      if (e.key.toLowerCase() === "b") this.setTool("brush");
      if (e.key.toLowerCase() === "l") this.setTool("line");
      if (e.key.toLowerCase() === "a") this.setTool("arrow");
      if (e.key.toLowerCase() === "r") this.setTool("rect");
      if (e.key === "Escape") this.toggle(false);
    });
  }

  private initStage() {
    if (!this.overlay) return;
    // вычисляем область под шапкой
    const header = document.getElementById("header");
    const topOffset = header ? header.getBoundingClientRect().height : 0;
    const width = window.innerWidth;
    const height = window.innerHeight - topOffset;
    this.overlay.style.top = `${topOffset}px`;
    this.overlay.style.display = "none";

    this.stage = new Konva.Stage({ container: this.overlay, width, height });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    // события указателя (Pointer Events)
    this.stage.on("mousedown touchstart", (e) => this.onPointerDown(e));
    this.stage.on("mousemove touchmove", (e) => this.onPointerMove(e));
    this.stage.on("mouseup touchend", (e) => this.onPointerUp(e));
  }

  private resize() {
    if (!this.stage) return;
    const header = document.getElementById("header");
    const topOffset = header ? header.getBoundingClientRect().height : 0;
    const width = window.innerWidth;
    const height = window.innerHeight - topOffset;
    this.overlay.style.top = `${topOffset}px`;
    this.stage.size({ width, height });
  }

  private _resizeScheduled = false;
  private scheduleResize() {
    if (this._resizeScheduled) return;
    this._resizeScheduled = true;
    requestAnimationFrame(() => {
      this._resizeScheduled = false;
      this.resize();
    });
  }

  private setTool(t: Tool) {
    this.tool = t;
    ["annotBrush", "annotLine", "annotArrow", "annotRect"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.classList.toggle(
          "active",
          (id === "annotBrush" && t === "brush") ||
            (id === "annotLine" && t === "line") ||
            (id === "annotArrow" && t === "arrow") ||
            (id === "annotRect" && t === "rect"),
        );
    });
  }

  private pickColor() {
    const input = document.createElement("input");
    input.type = "color";
    input.value = this.color;
    input.style.position = "fixed";
    input.style.left = "-1000px";
    document.body.appendChild(input);
    input.click();
    input.oninput = () => {
      this.color = input.value;
    };
    input.onchange = () => {
      document.body.removeChild(input);
    };
  }

  private pickSize() {
    const next = prompt("Толщина линии (1-20):", String(this.size));
    if (!next) return;
    const v = Math.max(1, Math.min(20, parseInt(next, 10) || this.size));
    this.size = v;
  }

  private toggle(force?: boolean) {
    const show =
      force !== undefined ? force : this.overlay.style.display !== "block";
    this.overlay.style.display = show ? "block" : "none";
    this.toolbar.style.display = show ? "flex" : "none";
    const btn = document.getElementById("annotateToggleBtn");
    if (btn) btn.classList.toggle("active", show);
    if (show) this.resize();
  }

  private onPointerDown(e: any) {
    if (!this.stage || !this.layer) return;
    this.drawing = true;
    this.points = [];
    this.currentShape = null;
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    if (this.tool === "brush") {
      this.points.push(pos.x, pos.y);
      const line = new Konva.Line({
        points: this.points,
        stroke: this.color,
        strokeWidth: this.size,
        lineCap: "round",
        lineJoin: "round",
        tension: 0.5,
        listening: false,
      });
      this.layer.add(line);
      this.currentShape = line;
    } else if (this.tool === "line" || this.tool === "arrow") {
      const line = new Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: this.color,
        strokeWidth: this.size,
        lineCap: "round",
        lineJoin: "round",
      });
      this.layer.add(line);
      this.currentShape = line;
    } else if (this.tool === "rect") {
      const rect = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: this.color,
        strokeWidth: this.size,
        listening: false,
      });
      this.layer.add(rect);
      this.currentShape = rect;
    }
  }

  private onPointerMove(e: any) {
    if (!this.drawing || !this.stage || !this.layer || !this.currentShape)
      return;
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    if (this.tool === "brush") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points().concat([pos.x, pos.y]);
      line.points(pts);
    } else if (this.tool === "line" || this.tool === "arrow") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points();
      pts[2] = pos.x;
      pts[3] = pos.y;
      line.points(pts);
    } else if (this.tool === "rect") {
      const rect = this.currentShape as Konva.Rect;
      const w = pos.x - rect.x();
      const h = pos.y - rect.y();
      rect.width(w);
      rect.height(h);
    }
    this.scheduleLayerDraw();
  }

  private onPointerUp(e: any) {
    if (!this.drawing || !this.layer || !this.currentShape) return;
    this.drawing = false;

    if (this.tool === "arrow") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points();
      // рисуем простой наконечник стрелки
      const [x1, y1, x2, y2] = pts;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 10 + this.size * 1.5;
      const hx1 = x2 - headLen * Math.cos(angle - Math.PI / 6);
      const hy1 = y2 - headLen * Math.sin(angle - Math.PI / 6);
      const hx2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
      const hy2 = x2 - headLen * Math.sin(angle + Math.PI / 6);
      const arrow = new Konva.Line({
        points: [x1, y1, x2, y2, hx1, hy1, x2, y2, hx2, hy2],
        stroke: this.color,
        strokeWidth: this.size,
        lineCap: "round",
        lineJoin: "round",
      });
      this.layer.add(arrow);
      line.destroy();
      this.currentShape = arrow;
    }

    this.history.push(this.currentShape);
    this.redoStack = [];
    this.scheduleLayerDraw();
  }

  private undo() {
    if (!this.layer) return;
    const shape = this.history.pop();
    if (!shape) return;
    this.redoStack.push(shape);
    shape.destroy();
    this.scheduleLayerDraw();
  }

  private redo() {
    if (!this.layer) return;
    const shape = this.redoStack.pop();
    if (!shape) return;
    this.layer.add(shape);
    this.history.push(shape);
    this.scheduleLayerDraw();
  }

  private clear() {
    if (!this.layer) return;
    this.layer.destroyChildren();
    this.history = [];
    this.redoStack = [];
    this.scheduleLayerDraw();
  }

  private scheduleLayerDraw() {
    if (!this.layer) return;
    if (this._drawScheduled) return;
    this._drawScheduled = true;
    requestAnimationFrame(() => {
      this._drawScheduled = false;
      try {
        if (this.layer) this.layer.batchDraw();
      } catch {}
    });
  }
}

export function setupAnnotationUI(opts?: { open?: boolean }) {
  // Проверяем наличие элементов перед инициализацией
  const overlay = document.getElementById("annotationOverlay");
  const toolbar = document.getElementById("annotToolbar");
  const btn = document.getElementById("annotateToggleBtn");
  if (!overlay || !toolbar || !btn) return;
  const manager = new AnnotationManager();
  (window as any).__annotationManager = manager;
  if (opts?.open) manager.openOverlay();
}
