import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface ToggleTablesSettings {
	rowThreshold: number;
	defaultCollapsed: boolean;
	showRowCount: boolean;
	animationSpeed: number;
	customSummaryText: string;
	enableHybridEditMode: boolean;
	enableMultiLineSupport: boolean;
	hybridPreviewOpacity: number;
	tableRowStyling: 'alternating' | 'single';
}

const DEFAULT_SETTINGS: ToggleTablesSettings = {
	rowThreshold: 10,
	defaultCollapsed: false,
	showRowCount: true,
	animationSpeed: 200,
	customSummaryText: "Click to expand table",
	enableHybridEditMode: true,
	enableMultiLineSupport: true,
	hybridPreviewOpacity: 0.3,
	tableRowStyling: 'alternating'
}

export default class ToggleTablesPlugin extends Plugin {
	settings: ToggleTablesSettings;

	async onload() {
		await this.loadSettings();

		// Load CSS styles
		this.loadStyles();

		// Apply table styling based on settings
		this.applyTableStyling();

		// Register markdown post processor to make tables toggleable
		this.registerMarkdownPostProcessor((element, context) => {
			this.processTables(element);
		});

		// Register editor extension for hybrid edit mode
		if (this.settings.enableHybridEditMode) {
			this.registerEditorExtension(this.createHybridEditExtension());
		}

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

		// Add command to toggle hybrid edit mode
		this.addCommand({
			id: 'toggle-hybrid-edit',
			name: 'Toggle Hybrid Edit Mode',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.toggleHybridEditMode(editor, view);
			}
		});

		// Add settings tab
		this.addSettingTab(new ToggleTablesSettingTab(this.app, this));
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

	private loadStyles() {
		// Load the CSS file
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = 'data:text/css;base64,' + btoa(`
			/* Toggle Tables Plugin Styles */
			.toggleable-table-wrapper {
				margin: 1em 0;
			}
			.toggleable-table {
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				background: var(--background-secondary);
				overflow: hidden;
				transition: all 0.2s ease-in-out;
			}
			.toggleable-table:hover {
				border-color: var(--interactive-accent);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
			.toggleable-table-summary {
				padding: 12px 16px;
				background: var(--background-primary);
				border-bottom: 1px solid var(--background-modifier-border);
				cursor: pointer;
				font-weight: 500;
				color: var(--text-normal);
				user-select: none;
				display: flex;
				align-items: center;
				justify-content: space-between;
				transition: background-color 0.2s ease;
			}
			.toggleable-table-summary:hover {
				background: var(--background-secondary);
			}
			.toggleable-table-summary::before {
				content: "▶";
				margin-right: 8px;
				font-size: 0.8em;
				color: var(--text-muted);
				transition: transform 0.2s ease;
			}
			.toggleable-table[open] .toggleable-table-summary::before {
				transform: rotate(90deg);
			}
			.toggleable-table table {
				margin: 0;
				border-collapse: collapse;
				width: 100%;
			}
			.toggleable-table table th,
			.toggleable-table table td {
				padding: 8px 12px;
				border: 1px solid var(--background-modifier-border);
			}
			.toggleable-table table th {
				background: var(--background-primary-alt);
				font-weight: 600;
				color: var(--text-normal);
			}
			.toggleable-table table td {
				background: var(--background-primary);
				color: var(--text-normal);
			}
			.toggleable-table table tr:nth-child(even) td {
				background: var(--toggleable-table-even-row-bg, var(--background-secondary));
			}
			.toggleable-table table tr:hover td {
				background: var(--background-modifier-hover);
			}
		`);
		document.head.appendChild(link);
	}

	private processTables(element: HTMLElement) {
		const tables = element.querySelectorAll('table');
		
		tables.forEach((table) => {
			const effectiveRowCount = this.countEffectiveRows(table);
			
			// Only make tables toggleable if they exceed the threshold
			if (effectiveRowCount > this.settings.rowThreshold) {
				this.makeTableToggleable(table);
			}
		});
	}

	private countEffectiveRows(table: HTMLTableElement): number {
		if (!this.settings.enableMultiLineSupport) {
			return table.rows.length;
		}

		let effectiveRows = 0;
		
		table.querySelectorAll('tr').forEach(row => {
			const cells = row.querySelectorAll('td, th');
			let maxLinesInRow = 1;
			
			cells.forEach(cell => {
				// Count line breaks in cell content
				const lineBreaks = (cell.textContent?.match(/\n/g) || []).length;
				const cellLines = lineBreaks + 1;
				maxLinesInRow = Math.max(maxLinesInRow, cellLines);
			});
			
			effectiveRows += maxLinesInRow;
		});
		
		return effectiveRows;
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
			summaryText += ` (${this.countEffectiveRows(table)} rows)`;
		}
		
		summary.textContent = summaryText;
		
		// Insert the toggle wrapper
		table.parentNode?.insertBefore(wrapper, table);
		wrapper.appendChild(details);
		details.appendChild(summary);
		details.appendChild(table);
		
		// Apply current styling to the table
		this.applyTableStyling();
		
		// Add click handler for better UX
		summary.addEventListener('click', (e) => {
			e.preventDefault();
			details.toggleAttribute('open');
		});
	}

	private createHybridEditExtension() {
		// Import the necessary CodeMirror extensions
		const { EditorView } = require('@codemirror/view');
		const { StateField, StateEffect } = require('@codemirror/state');
		
		// Create a state field to track table preview state
		const tablePreviewState = StateField.define({
			create: () => ({ active: false, tableRange: null }),
			update: (value, tr) => {
				// Update state based on cursor position
				const cursor = tr.selection.main.head;
				const tableRange = this.findTableRangeAtPosition(tr.doc, cursor);
				
				if (tableRange) {
					return { active: true, tableRange };
				} else {
					return { active: false, tableRange: null };
				}
			}
		});

		// Create the extension
		return [
			tablePreviewState,
			EditorView.updateListener.of((update) => {
				if (update.docChanged || update.selectionSet) {
					this.handleHybridEditUpdate(update);
				}
			})
		];
	}

	private findTableRangeAtPosition(doc: any, pos: number): { start: number, end: number } | null {
		// Find table boundaries at cursor position
		const line = doc.lineAt(pos);
		const lineText = line.text;
		
		if (lineText.includes('|')) {
			// Find table start and end
			const tableStart = this.findTableStartInDoc(doc, line.number);
			const tableEnd = this.findTableEndInDoc(doc, line.number);
			
			if (tableStart !== -1 && tableEnd !== -1) {
				return { start: tableStart, end: tableEnd };
			}
		}
		
		return null;
	}

	private findTableStartInDoc(doc: any, lineNum: number): number {
		let currentLine = lineNum;
		while (currentLine >= 0) {
			const line = doc.line(currentLine + 1);
			if (line.text.trim().startsWith('|') && line.text.trim().endsWith('|')) {
				currentLine--;
			} else {
				break;
			}
		}
		return doc.line(currentLine + 2).from;
	}

	private findTableEndInDoc(doc: any, lineNum: number): number {
		let currentLine = lineNum;
		const totalLines = doc.lines;
		
		while (currentLine < totalLines) {
			const line = doc.line(currentLine + 1);
			if (line.text.trim().startsWith('|') && line.text.trim().endsWith('|')) {
				currentLine++;
			} else {
				break;
			}
		}
		return doc.line(currentLine).to;
	}

	private handleHybridEditUpdate(update: any) {
		// Handle hybrid edit mode updates
		if (!this.settings.enableHybridEditMode) return;
		
		const cursor = update.state.selection.main.head;
		const tableRange = this.findTableRangeAtPosition(update.state.doc, cursor);
		
		if (tableRange) {
			this.showTablePreview(tableRange);
		} else {
			this.hideTablePreview();
		}
	}

	private showTablePreview(tableRange: { start: number, end: number }) {
		// Show rendered table preview
		const activeView = this.app.workspace.activeLeaf?.view;
		if (activeView instanceof MarkdownView) {
			const editor = activeView.editor;
			const tableText = editor.getRange(tableRange.start, tableRange.end);
			
			// Create floating preview
			this.createFloatingPreview(tableText, tableRange);
		}
	}

	private hideTablePreview() {
		// Hide floating preview
		const existingPreview = document.querySelector('.table-preview-overlay');
		if (existingPreview) {
			existingPreview.remove();
		}
	}

	private createFloatingPreview(tableText: string, range: { start: number, end: number }) {
		// Remove existing preview
		this.hideTablePreview();
		
		// Create new preview
		const preview = document.createElement('div');
		preview.className = 'table-preview-overlay';
		preview.innerHTML = `
			<div class="table-preview-content">
				<div class="table-preview-header">Table Preview</div>
				<div class="table-preview-body">${this.convertMarkdownToHtml(tableText)}</div>
			</div>
		`;
		
		// Position the preview
		const activeView = this.app.workspace.activeLeaf?.view;
		if (activeView instanceof MarkdownView) {
			const editorElement = activeView.editorEl;
			editorElement.appendChild(preview);
		}
	}

	private convertMarkdownToHtml(markdown: string): string {
		// Simple markdown to HTML conversion for tables
		const lines = markdown.split('\n');
		let html = '<table>';
		
		lines.forEach((line, index) => {
			if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
				const cells = line.split('|').slice(1, -1);
				const isHeader = index === 0 || lines[index - 1].includes('---');
				
				html += `<tr>`;
				cells.forEach(cell => {
					const tag = isHeader ? 'th' : 'td';
					html += `<${tag}>${cell.trim()}</${tag}>`;
				});
				html += `</tr>`;
			}
		});
		
		html += '</table>';
		return html;
	}

	private toggleHybridEditMode(editor: Editor, view: MarkdownView) {
		this.settings.enableHybridEditMode = !this.settings.enableHybridEditMode;
		this.saveSettings();
		
		if (this.settings.enableHybridEditMode) {
			this.registerEditorExtension(this.createHybridEditExtension());
		} else {
			this.hideTablePreview();
		}
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

	public applyTableStyling() {
		// Apply CSS custom properties to the document root
		const root = document.documentElement;
		
		if (this.settings.tableRowStyling === 'single') {
			// For single color, set even rows to same color as odd rows
			root.style.setProperty('--toggleable-table-even-row-bg', 'var(--background-primary)');
		} else {
			// For alternating colors, use the default secondary background
			root.style.setProperty('--toggleable-table-even-row-bg', 'var(--background-secondary)');
		}
	}
}

class ToggleTablesSettingTab extends PluginSettingTab {
	plugin: ToggleTablesPlugin;

	constructor(app: App, plugin: ToggleTablesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Toggle Tables Settings' });

		new Setting(containerEl)
			.setName('Row Threshold')
			.setDesc('Tables with more than this many rows will be made toggleable')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.rowThreshold.toString())
				.onChange(async (value) => {
					this.plugin.settings.rowThreshold = parseInt(value) || 10;
					await this.plugin.saveSettings();
					this.plugin.applyTableStyling(); // Apply styling after changing row threshold
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

		new Setting(containerEl)
			.setName('Enable Multi-line Cell Support')
			.setDesc('Count line breaks within cells when determining table size')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableMultiLineSupport)
				.onChange(async (value) => {
					this.plugin.settings.enableMultiLineSupport = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Hybrid Edit Mode')
			.setDesc('Show table preview when cursor is in table area')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableHybridEditMode)
				.onChange(async (value) => {
					this.plugin.settings.enableHybridEditMode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Hybrid Preview Opacity')
			.setDesc('Opacity of the floating table preview')
			.addSlider(slider => slider
				.setLimits(0.1, 1.0, 0.1)
				.setValue(this.plugin.settings.hybridPreviewOpacity)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.hybridPreviewOpacity = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Table Row Styling')
			.setDesc('Choose how table rows are styled (alternating or single color)')
			.addDropdown(dropdown => dropdown
				.addOption('alternating', 'Alternating Colors')
				.addOption('single', 'Single Color')
				.setValue(this.plugin.settings.tableRowStyling)
				.onChange(async (value) => {
					this.plugin.settings.tableRowStyling = value as 'alternating' | 'single';
					await this.plugin.saveSettings();
					this.plugin.applyTableStyling(); // Apply styling after changing row styling
				}));
	}
} 