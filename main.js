var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ToggleableTablesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  rowThreshold: 10,
  defaultCollapsed: false,
  showRowCount: true,
  animationSpeed: 200,
  customSummaryText: "Click to expand table"
};
var ToggleableTablesPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.registerMarkdownPostProcessor((element, context) => {
      this.processTables(element);
    });
    this.addCommand({
      id: "toggle-table",
      name: "Toggle Table Collapse",
      editorCallback: (editor, view) => {
        this.toggleTableAtCursor(editor, view);
      }
    });
    this.addCommand({
      id: "wrap-table-in-toggle",
      name: "Wrap Table in Toggle",
      editorCallback: (editor, view) => {
        this.wrapTableInToggle(editor, view);
      }
    });
    this.addSettingTab(new ToggleableTablesSettingTab(this.app, this));
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  processTables(element) {
    const tables = element.querySelectorAll("table");
    tables.forEach((table) => {
      const rowCount = table.rows.length;
      if (rowCount > this.settings.rowThreshold) {
        this.makeTableToggleable(table);
      }
    });
  }
  makeTableToggleable(table) {
    if (table.closest(".toggleable-table-wrapper")) {
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "toggleable-table-wrapper";
    const details = document.createElement("details");
    details.className = "toggleable-table";
    if (this.settings.defaultCollapsed) {
      details.setAttribute("open", "");
    }
    const summary = document.createElement("summary");
    summary.className = "toggleable-table-summary";
    let summaryText = this.settings.customSummaryText;
    if (this.settings.showRowCount) {
      const rowCount = table.rows.length;
      summaryText += ` (${rowCount} rows)`;
    }
    summary.textContent = summaryText;
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(details);
    details.appendChild(summary);
    details.appendChild(table);
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      details.toggleAttribute("open");
    });
  }
  toggleTableAtCursor(editor, view) {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const tableStart = this.findTableStart(editor, cursor.line);
    const tableEnd = this.findTableEnd(editor, cursor.line);
    if (tableStart !== -1 && tableEnd !== -1) {
      const activeLeaf = this.app.workspace.activeLeaf;
      if (activeLeaf?.view instanceof import_obsidian.MarkdownView) {
        const viewElement = activeLeaf.view.contentEl;
        const tables = viewElement.querySelectorAll("table");
        tables.forEach((table) => {
          const wrapper = table.closest(".toggleable-table-wrapper");
          if (wrapper) {
            const details = wrapper.querySelector("details");
            if (details) {
              details.toggleAttribute("open");
            }
          }
        });
      }
    }
  }
  wrapTableInToggle(editor, view) {
    const cursor = editor.getCursor();
    const tableStart = this.findTableStart(editor, cursor.line);
    const tableEnd = this.findTableEnd(editor, cursor.line);
    if (tableStart !== -1 && tableEnd !== -1) {
      const toggleStart = "<!-- toggle-table -->\n";
      const toggleEnd = "\n<!-- /toggle-table -->";
      editor.replaceRange(toggleStart, { line: tableStart, ch: 0 });
      editor.replaceRange(toggleEnd, { line: tableEnd + 1, ch: 0 });
    }
  }
  findTableStart(editor, line) {
    let currentLine = line;
    while (currentLine >= 0) {
      const lineText = editor.getLine(currentLine);
      if (lineText.trim().startsWith("|") && lineText.trim().endsWith("|")) {
        currentLine--;
      } else {
        break;
      }
    }
    return currentLine + 1;
  }
  findTableEnd(editor, line) {
    let currentLine = line;
    const totalLines = editor.lineCount();
    while (currentLine < totalLines) {
      const lineText = editor.getLine(currentLine);
      if (lineText.trim().startsWith("|") && lineText.trim().endsWith("|")) {
        currentLine++;
      } else {
        break;
      }
    }
    return currentLine - 1;
  }
};
var ToggleableTablesSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Toggleable Tables Settings" });
    new import_obsidian.Setting(containerEl).setName("Row Threshold").setDesc("Tables with more than this many rows will be made toggleable").addText((text) => text.setPlaceholder("10").setValue(this.plugin.settings.rowThreshold.toString()).onChange(async (value) => {
      this.plugin.settings.rowThreshold = parseInt(value) || 10;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Default Collapsed").setDesc("Whether tables should be collapsed by default").addToggle((toggle) => toggle.setValue(this.plugin.settings.defaultCollapsed).onChange(async (value) => {
      this.plugin.settings.defaultCollapsed = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Show Row Count").setDesc("Show the number of rows in the toggle summary").addToggle((toggle) => toggle.setValue(this.plugin.settings.showRowCount).onChange(async (value) => {
      this.plugin.settings.showRowCount = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Animation Speed").setDesc("Speed of the toggle animation in milliseconds").addSlider((slider) => slider.setLimits(0, 500, 50).setValue(this.plugin.settings.animationSpeed).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.animationSpeed = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Custom Summary Text").setDesc("Text to show in the toggle summary").addText((text) => text.setPlaceholder("Click to expand table").setValue(this.plugin.settings.customSummaryText).onChange(async (value) => {
      this.plugin.settings.customSummaryText = value;
      await this.plugin.saveSettings();
    }));
  }
};
