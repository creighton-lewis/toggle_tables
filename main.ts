import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface ToggleableTablesSettings {
	rowThreshold: number;
	defaultCollapsed: boolean;
	showRowCount: boolean;
	animationSpeed: number;
	customSummaryText: string;
}

const DEFAULT_SETTINGS: ToggleableTablesSettings = {
	rowThreshold: 10,
	defaultCollapsed: false,
	showRowCount: true,
	animationSpeed: 200,
	customSummaryText: "Click to expand table"
}

export default class ToggleableTablesPlugin extends Plugin {
	settings: ToggleableTablesSettings;

	async onload() {
		await this.loadSettings();

		// Register markdown post processor to make tables toggleable
		this.registerMarkdownPostProcessor((element, context) => {
			this.processTables(element);
		});

		// Add command to toggle table manually
		this.addCommand({
			id: 'toggle-table',
			name: 'Toggle Table Collapse',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.toggleTableAtCursor(editor, view);
			}
		});

		// Add command to wrap selected table in toggle
		this.addCommand({
			id: 'wrap-table-in-toggle',
			name: 'Wrap Table in Toggle',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.wrapTableInToggle(editor, view);
			}
		});

		// Add settings tab
		this.addSettingTab(new ToggleableTablesSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private processTables(element: HTMLElement) {
		const tables = element.querySelectorAll('table');
		
		tables.forEach((table) => {
			const rowCount = table.rows.length;
			
			// Only make tables toggleable if they exceed the threshold
			if (rowCount > this.settings.rowThreshold) {
				this.makeTableToggleable(table);
			}
		});
	}

	private makeTableToggleable(table: HTMLTableElement) {
		// Check if already processed
		if (table.closest('.toggleable-table-wrapper')) {
			return;
		}

		const wrapper = document.createElement('div');
		wrapper.className = 'toggleable-table-wrapper';
		
		const details = document.createElement('details');
		details.className = 'toggleable-table';
		
		if (this.settings.defaultCollapsed) {
			details.setAttribute('open', '');
		}
		
		const summary = document.createElement('summary');
		summary.className = 'toggleable-table-summary';
		
		let summaryText = this.settings.customSummaryText;
		if (this.settings.showRowCount) {
			const rowCount = table.rows.length;
			summaryText += ` (${rowCount} rows)`;
		}
		
		summary.textContent = summaryText;
		
		// Insert the toggle wrapper
		table.parentNode?.insertBefore(wrapper, table);
		wrapper.appendChild(details);
		details.appendChild(summary);
		details.appendChild(table);
		
		// Add click handler for better UX
		summary.addEventListener('click', (e) => {
			e.preventDefault();
			details.toggleAttribute('open');
		});
	}

	private toggleTableAtCursor(editor: Editor, view: MarkdownView) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		
		// Find table boundaries
		const tableStart = this.findTableStart(editor, cursor.line);
		const tableEnd = this.findTableEnd(editor, cursor.line);
		
		if (tableStart !== -1 && tableEnd !== -1) {
			// Toggle the table in the DOM
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf?.view instanceof MarkdownView) {
				const viewElement = activeLeaf.view.contentEl;
				const tables = viewElement.querySelectorAll('table');
				
				tables.forEach(table => {
					const wrapper = table.closest('.toggleable-table-wrapper');
					if (wrapper) {
						const details = wrapper.querySelector('details');
						if (details) {
							details.toggleAttribute('open');
						}
					}
				});
			}
		}
	}

	private wrapTableInToggle(editor: Editor, view: MarkdownView) {
		const cursor = editor.getCursor();
		const tableStart = this.findTableStart(editor, cursor.line);
		const tableEnd = this.findTableEnd(editor, cursor.line);
		
		if (tableStart !== -1 && tableEnd !== -1) {
			// Insert toggle wrapper around the table
			const toggleStart = '<!-- toggle-table -->\n';
			const toggleEnd = '\n<!-- /toggle-table -->';
			
			editor.replaceRange(toggleStart, { line: tableStart, ch: 0 });
			editor.replaceRange(toggleEnd, { line: tableEnd + 1, ch: 0 });
		}
	}

	private findTableStart(editor: Editor, line: number): number {
		let currentLine = line;
		while (currentLine >= 0) {
			const lineText = editor.getLine(currentLine);
			if (lineText.trim().startsWith('|') && lineText.trim().endsWith('|')) {
				currentLine--;
			} else {
				break;
			}
		}
		return currentLine + 1;
	}

	private findTableEnd(editor: Editor, line: number): number {
		let currentLine = line;
		const totalLines = editor.lineCount();
		
		while (currentLine < totalLines) {
			const lineText = editor.getLine(currentLine);
			if (lineText.trim().startsWith('|') && lineText.trim().endsWith('|')) {
				currentLine++;
			} else {
				break;
			}
		}
		return currentLine - 1;
	}
}

class ToggleableTablesSettingTab extends PluginSettingTab {
	plugin: ToggleableTablesPlugin;

	constructor(app: App, plugin: ToggleableTablesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Toggleable Tables Settings' });

		new Setting(containerEl)
			.setName('Row Threshold')
			.setDesc('Tables with more than this many rows will be made toggleable')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.rowThreshold.toString())
				.onChange(async (value) => {
					this.plugin.settings.rowThreshold = parseInt(value) || 10;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Default Collapsed')
			.setDesc('Whether tables should be collapsed by default')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.defaultCollapsed)
				.onChange(async (value) => {
					this.plugin.settings.defaultCollapsed = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Row Count')
			.setDesc('Show the number of rows in the toggle summary')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showRowCount)
				.onChange(async (value) => {
					this.plugin.settings.showRowCount = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Animation Speed')
			.setDesc('Speed of the toggle animation in milliseconds')
			.addSlider(slider => slider
				.setLimits(0, 500, 50)
				.setValue(this.plugin.settings.animationSpeed)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.animationSpeed = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Custom Summary Text')
			.setDesc('Text to show in the toggle summary')
			.addText(text => text
				.setPlaceholder('Click to expand table')
				.setValue(this.plugin.settings.customSummaryText)
				.onChange(async (value) => {
					this.plugin.settings.customSummaryText = value;
					await this.plugin.saveSettings();
				}));
	}
} 