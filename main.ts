



//ersion 2

import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian'
import { Howl } from 'howler';
import { defaultSounds } from './defaultSounds';


type PresetSoundKey = keyof typeof defaultSounds;

//const testSound: PresetSoundKey = 'expandSound1'; // Does this line error?



interface DefaultSounds {
	expandSound1: string;
	expandSound2: string;
	expandSound3: string;
	expandSound5: string;
	expandSound4: string;
}


interface toggle_tablesSettings {
	presetSound: PresetSoundKey,
	soundType: any,
	rowThreshold: number;
	defaultCollapsed: boolean;
	showRowCount: boolean;
	animationSpeed: number;
	customSummaryText: string;
	enableSounds: boolean;
	soundVolume: number;
	evenRowBackground: string;
	oddRowBackground: string;
	headerBackground: string;
	headerTextColor: string;
	hoverBackground: string;
	hoverTextColor: string;
	alternatingRowColors: boolean;
}

const DEFAULT_SETTINGS: toggle_tablesSettings = {
	evenRowBackground: "#f8f9fa",
	oddRowBackground: "#ffffff",
	headerBackground: "#e9ecef",
	headerTextColor: "#495057",
	hoverBackground: "#e3f2fd",
	hoverTextColor: "#1976d2",
	alternatingRowColors: true,
	rowThreshold: 10,
	defaultCollapsed: false,
	showRowCount: true,
	animationSpeed: 200,
	customSummaryText: "Click to expand table",
	enableSounds: true,
	presetSound: 'expandSound1',
	soundVolume: 0.6,
	soundType: 'preset'
}
export default class toggle_tablesPlugin extends Plugin {
	settings: toggle_tablesSettings;
	audioCache = new Map<string, Howl>();

	async onload() {
		await this.loadSettings();

		// Register markdown post processor to make tables toggleable
		this.registerMarkdownPostProcessor((element, context) => {
			this.processTables(element);
		});

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			this.processTables(view.contentEl);
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

		// Add settings tab
		this.addSettingTab(new toggle_tablesSettingTab(this.app, this));

		// Preload audio if sounds are enabled
		if (this.settings.enableSounds) {
			this.preloadAudio();
			this.audioCache.clear();    //TEMPORARY
		}

		// Apply custom styles
		this.applyCustomStyles();
	}

	onunload() {
		// Clear audio cache
		this.audioCache.clear();
		// Remove custom styles
		this.removeCustomStyles();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Reload audio if settings changed
		if (this.settings.enableSounds) {
			this.preloadAudio();
		}
		// Reapply custom styles
		this.applyCustomStyles();
	}

	private async preloadAudio() {
		try {
			// Clear existing cache
			this.audioCache.clear();
			
			let audioSrc: string;
			
			
				audioSrc = defaultSounds[this.settings.presetSound];
			
			
			if (audioSrc) {
				const sound = new Howl({
					src: [audioSrc],
					volume: this.settings.soundVolume,
					preload: true
				});
				
				this.audioCache.set('toggleSound', sound);
			}
		} catch (error) {
			console.error('Toggle Tables: Failed to preload audio:', error);
		}
	}
	public async refreshAudioCache() {
		await this.preloadAudio();
	}

	
	async playToggleSound() {
		if (!this.settings.enableSounds) return;
		console.log(this.settings.presetSound)

		try {
			const sound = this.audioCache.get('toggleSound');
			if (sound) {
				sound.volume(this.settings.soundVolume);
				sound.play();
			} else {
				// Fallback: try to create and play sound on the fly
				await this.preloadAudio();
				const newSound = this.audioCache.get('toggleSound');
				if (newSound) {
					newSound.play();
				}
			}
		} catch (error) {
			console.error('Toggle Tables: Audio playback failed:', error);
		}
	}

	async testSound(): Promise<boolean> {
		try {
			await this.preloadAudio();
			await this.playToggleSound();
			return true;
		} catch (error) {
			console.error('Toggle Tables: Sound test failed:', error);
			return false;
		}
	}

	private processTables(element: HTMLElement) {
		const tables = element.querySelectorAll('table');
		
		tables.forEach((table) => {
			const rowCount = table.rows.length;
			
			// Only make tables toggleable if they exceed the threshold
			if (rowCount > (this.settings?.rowThreshold ?? 0)) {
				this.makeTableToggleable(table as HTMLTableElement);
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
		
		// Set initial state based on settings
		if (!this.settings.defaultCollapsed) {
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
		
		// Add toggle event listener for sound effects
		details.addEventListener('toggle', () => {
			this.playToggleSound();
			console.log(this.settings.presetSound, defaultSounds[this.settings.presetSound]);
		});

		// Optional: Add custom animation timing
		if (this.settings.animationSpeed !== 200) {
			details.style.setProperty('--animation-speed', `${this.settings.animationSpeed}ms`);
		}
	}
	//audit

	private applyCustomStyles() {
		// Remove existing styles first
		this.removeCustomStyles();

		const styleId = 'toggle-tables-custom-styles';
		let styleEl = document.getElementById(styleId) as HTMLStyleElement;
		
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = styleId;
			document.head.appendChild(styleEl);
		}

		let css = '';

		if (this.settings.alternatingRowColors) {
			css += `
				.toggleable-table-wrapper table tr:nth-child(even) {
					background-color: ${this.settings.evenRowBackground} !important;
				}
				.toggleable-table-wrapper table tr:nth-child(odd) {
					background-color: ${this.settings.oddRowBackground} !important;
				}
			`;
		}

		css += `
			.toggleable-table-wrapper table th {
				background-color: ${this.settings.headerBackground} !important;
				color: ${this.settings.headerTextColor} !important;
			}
			.toggleable-table-wrapper table tr:hover {
				background-color: ${this.settings.hoverBackground} !important;
				color: ${this.settings.hoverTextColor} !important;
			}
			.toggleable-table details {
				transition: all var(--animation-speed, 200ms) ease-in-out;
			}
		`;

		styleEl.textContent = css;
	}

	private removeCustomStyles() {
		const styleEl = document.getElementById('toggle-tables-custom-styles');
		if (styleEl) {
			styleEl.remove();
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
						const details = wrapper.querySelector('details') as HTMLDetailsElement;
						if (details) {
							details.open = !details.open;
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

class toggle_tablesSettingTab extends PluginSettingTab {
	plugin: toggle_tablesPlugin;

	constructor(app: App, plugin: toggle_tablesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Toggleable Tables Settings' });

		// Basic Settings
		containerEl.createEl('h3', { text: 'Table Behavior' });

		new Setting(containerEl)
			.setName('Row Threshold')
			.setDesc('Tables with more than this many rows will be made toggleable')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.rowThreshold.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.rowThreshold = numValue;
						await this.plugin.saveSettings();
					}
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
					this.plugin.settings.customSummaryText = value || 'Click to expand table';
					await this.plugin.saveSettings();
				}));

		// Sound Settings
		containerEl.createEl('h3', { text: 'Sound Effects' });

		new Setting(containerEl)
			.setName('Enable Sounds')
			.setDesc('Play sounds when expanding/collapsing tables')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableSounds)
				.onChange(async (value) => {
					this.plugin.settings.enableSounds = value;
					await this.plugin.saveSettings();
					
				}));

		new Setting(containerEl)
			.setName('Sound Volume')
			.setDesc('Volume for sound effects (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.soundVolume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.soundVolume = value;
					await this.plugin.saveSettings();
				}));

		// Sound Type Selection
		if (this.plugin.settings.soundType === 'preset') {
			new Setting(containerEl)
				.setName('Choose Sound')
				.setDesc('Turn desired sound to base64 and add it here')
				.addDropdown(dropdown => {
					dropdown.addOption('expandSound1', 'Expand Sound 1');
					dropdown.addOption('expandSound2', 'Expand Sound 2');
					dropdown.addOption('expandSound3', 'Expand Sound 3');
					dropdown.addOption('expandSound4',  'Expand Sound 4');
					dropdown.addOption('expandSound5',  'Expand Sound 5');

					dropdown.setValue(this.plugin.settings.presetSound);
					dropdown.onChange(async (value: PresetSoundKey) => {
					    this.plugin.settings.presetSound = value ;
						await this.plugin.saveSettings();
					});
				});
		} else {
	   	// File status indicator
		//	const fileStatus = containerEl.createEl('div', { 
		//		cls: 'setting-item-description',
		//		text: this.getFileStatusText()
		//	});
			
			// Add file status styling
			//fileStatus.style.color = this.getFileStatusColor();
		}

		// Test Sound Button
		if (this.plugin.settings.enableSounds) {
			new Setting(containerEl)
				.setName('Test Sound')
				.setDesc('Play a test sound to check your audio settings')
				.addButton(button => button
					.setButtonText('🔊 Test Sound')
					.setTooltip('Click to test the current sound settings')
					.onClick(async () => {
						const success = await this.plugin.testSound();
						if (!success) {
							// Show error message
							const errorEl = containerEl.createEl('div', {
								text: '❌ Sound test failed! Please check your audio file path and try again.',
								cls: 'setting-item-description'
							});
							errorEl.style.color = '#e74c3c';
							setTimeout(() => errorEl.remove(), 5000);
						} else {
							// Show success message
							const successEl = containerEl.createEl('div', {
								text: '✅ Sound test successful!',
								cls: 'setting-item-description'
							});
							successEl.style.color = '#27ae60';
							setTimeout(() => successEl.remove(), 3000);
						}
					}));
		}

		// Row Styling
		containerEl.createEl('h3', { text: 'Row Styling Options' });
		
		new Setting(containerEl)
			.setName('Alternating Row Colors')
			.setDesc('Enable alternating background colors for table rows')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.alternatingRowColors)
					.onChange(async (value) => {
						this.plugin.settings.alternatingRowColors = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Even Row Background')
			.setDesc('Background color for even-numbered rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.evenRowBackground)
					.onChange(async (value) => {
						this.plugin.settings.evenRowBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Odd Row Background')
			.setDesc('Background color for odd-numbered rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.oddRowBackground)
					.onChange(async (value) => {
						this.plugin.settings.oddRowBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Header Background')
			.setDesc('Background color for table headers')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.headerBackground)
					.onChange(async (value) => {
						this.plugin.settings.headerBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Header Text Color')
			.setDesc('Text color for table headers')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.headerTextColor)
					.onChange(async (value) => {
						this.plugin.settings.headerTextColor = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Hover Background')
			.setDesc('Background color when hovering over table rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.hoverBackground)
					.onChange(async (value) => {
						this.plugin.settings.hoverBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Hover Text Color')
			.setDesc('Text color when hovering over table rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.hoverTextColor)
					.onChange(async (value) => {
						this.plugin.settings.hoverTextColor = value;
						await this.plugin.saveSettings();
					})
			);
	}

	

	private getFileStatusText(): string {
	
		
		// Simple existence check - in a real implementation, you'd want to verify the file exists
	
	
		
		return '#e74c3c'; // Red for invalid file
	}
}







/*import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting, TFile, FileSystemAdapter, normalizePath} from 'obsidian'
import { Howl, Howler} from 'howler';
import * as defaultSounds from 'defaultSounds';

interface toggle_tablesSettings {
	rowThreshold: number;
	defaultCollapsed: boolean;
	showRowCount: boolean;
	animationSpeed: number;
	customSummaryText: string;
	enableSounds: boolean;
	expandSoundUrl: string;
	soundVolume: number;
	evenRowBackground: string;
	oddRowBackground: string;
	headerBackground: string;
	headerTextColor: string;
	hoverBackground: string;
	hoverTextColor: string;
	alternatingRowColors: boolean;
}

const DEFAULT_SETTINGS: toggle_tablesSettings = {
	evenRowBackground: "#f8f9fa",
	oddRowBackground: "#ffffff",
	headerBackground: "#e9ecef",
	headerTextColor: "#495057",
	hoverBackground: "#e3f2fd",
	hoverTextColor: "#1976d2",
	alternatingRowColors: true,
	rowThreshold: 10,
	defaultCollapsed: false,
	showRowCount: true,
	animationSpeed: 200,
	customSummaryText: "Click to expand table",
	enableSounds: true,
	expandSoundUrl: "https://www.soundjay.com/misc/sounds/bell_tree.wav", // Example URL
	soundVolume: 0.3,
	 
}

export default class toggle_tablesPlugin extends Plugin {
	settings: toggle_tablesSettings;
	audioCache = new Map<string, HTMLAudioElement>();

	async onload() {
		await this.loadSettings();

		// Register markdown post processor to make tables toggleable
		this.registerMarkdownPostProcessor((element, context) => {
			this.processTables(element);
		});

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			this.processTables(view.contentEl);
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

		// Add settings tab
		this.addSettingTab(new toggle_tablesSettingTab(this.app, this));

		// Preload audio files if sounds are enabled
		if (this.settings.enableSounds) {
			this.preloadAudioFiles();
		}

		// Apply custom styles
		this.applyCustomStyles();
	}

	onunload() {
		// Clear audio cache
		this.audioCache.clear();
		// Remove custom styles
		this.removeCustomStyles();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Reload audio files if settings changed
		if (this.settings.enableSounds) {
			this.preloadAudioFiles();
		}
		// Reapply custom styles
		this.applyCustomStyles();
	}

	async playSound(type: 'expand' | 'collapse') {
		if (!this.settings.enableSounds) return;

		const src = this.settings.expandSoundUrl;
		if (!src) return;

		const volume = this.settings.soundVolume ?? 1;

		try {
			// Use cached audio if available
			let audio = this.audioCache.get('expand');
			if (!audio) {
				audio = new Audio();
				
				// Handle local file paths
				if (!src.startsWith('file://')) {
					const adapter = this.app.vault.adapter;
					if (adapter instanceof FileSystemAdapter) {
						const vaultPath = adapter.getBasePath();
						audio.src = `file://${vaultPath}/${normalizePath(src)}`;
					} else {
						console.warn("Toggle Tables: Cannot resolve vault path — non-filesystem adapter in use.");
						audio.src = src;
					}
				} else {
					audio.src = src;
				}
				
				this.audioCache.set('expand', audio);
			}

			audio.volume = volume;
			
			// For collapse, we'll use the Web Audio API to reverse the sound
			if (type === 'collapse') {
				await this.playReversedAudio(src, volume);
			} else {
				await audio.play();
			}
		} catch (err) {
			console.error("Audio playback failed:", err);
		}
	}

	private async playReversedAudio(src: string, volume: number) {
		try {
			const audioContext = new AudioContext();
			
			// Handle local file paths for fetch
			let fetchSrc = src;
			if (!src.startsWith('file://')) {
				const adapter = this.app.vault.adapter;
				if (adapter instanceof FileSystemAdapter) {
					const vaultPath = adapter.getBasePath();
					fetchSrc = `file://${vaultPath}/${normalizePath(src)}`;
				}
			}

			const response = await fetch(fetchSrc);
			const arrayBuffer = await response.arrayBuffer();
			const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

			// Reverse the audio buffer for collapse
			const reversedBuffer = audioContext.createBuffer(
				originalBuffer.numberOfChannels,
				originalBuffer.length,
				originalBuffer.sampleRate
			);

			for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
				const original = originalBuffer.getChannelData(i);
				const reversed = reversedBuffer.getChannelData(i);
				for (let j = 0; j < original.length; j++) {
					reversed[j] = original[original.length - j - 1];
				}
			}

			await audioContext.resume();

			const source = audioContext.createBufferSource();
			source.buffer = reversedBuffer;

			// Add volume control
			const gainNode = audioContext.createGain();
			gainNode.gain.value = volume;

			source.connect(gainNode).connect(audioContext.destination);
			source.start();
		} catch (err) {
			console.error("Reversed audio playback failed:", err);
		}
	}

	private async preloadAudioFiles() {
		try {
			// Clear existing cache
			this.audioCache.clear();
			
			if (this.settings.expandSoundUrl) {
				const audio = new Audio();
				
				// Handle local file paths
				const src = this.settings.expandSoundUrl;
				if (!src.startsWith('http') &&!src.startsWith('file://')) {
					const adapter = this.app.vault.adapter;
					if (adapter instanceof FileSystemAdapter) {
						const vaultPath = adapter.getBasePath();
						audio.src = `file://${vaultPath}/${normalizePath(src)}`;
					} else {
						audio.src = src;
					}
				} else {
					audio.src = src;
				}
				
				audio.volume = this.settings.soundVolume;
				this.audioCache.set('expand', audio);
			}
		} catch (error) {
			console.error('Toggle Tables: Failed to preload audio files:', error);
		}
	}

	private processTables(element: HTMLElement) {
		const tables = element.querySelectorAll('table');
		
		tables.forEach((table) => {
			const rowCount = table.rows.length;
			
			// Only make tables toggleable if they exceed the threshold
			if (rowCount > (this.settings?.rowThreshold ?? 0)) {
				this.makeTableToggleable(table as HTMLTableElement);
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
		
		// Fix: defaultCollapsed should REMOVE the open attribute, not add it
		if (!this.settings.defaultCollapsed) {
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
		
		// Add toggle event listener for sound effects
		details.addEventListener('toggle', (e) => {
			const isOpen = details.hasAttribute('open');
			if (isOpen) {
			sound.play()
			} else {
				this.playSound('collapse');
			}
		});

		// Optional: Add custom animation timing
		if (this.settings.animationSpeed !== 200) {
			details.style.setProperty('--animation-speed', `${this.settings.animationSpeed}ms`);
		}
	}

	private applyCustomStyles() {
		// Remove existing styles first
		this.removeCustomStyles();

		const styleId = 'toggle-tables-custom-styles';
		let styleEl = document.getElementById(styleId) as HTMLStyleElement;
		
		if (!styleEl) {
			styleEl = document.createElement('style');
			styleEl.id = styleId;
			document.head.appendChild(styleEl);
		}

		let css = '';

		if (this.settings.alternatingRowColors) {
			css += `
				.toggleable-table-wrapper table tr:nth-child(even) {
					background-color: ${this.settings.evenRowBackground} !important;
				}
				.toggleable-table-wrapper table tr:nth-child(odd) {
					background-color: ${this.settings.oddRowBackground} !important;
				}
			`;
		}

		css += `
			.toggleable-table-wrapper table th {
				background-color: ${this.settings.headerBackground} !important;
				color: ${this.settings.headerTextColor} !important;
			}
			.toggleable-table-wrapper table tr:hover {
				background-color: ${this.settings.hoverBackground} !important;
				color: ${this.settings.hoverTextColor} !important;
			}
			.toggleable-table details {
				transition: all var(--animation-speed, 200ms) ease-in-out;
			}
		`;

		styleEl.textContent = css;
	}

	private removeCustomStyles() {
		const styleEl = document.getElementById('toggle-tables-custom-styles');
		if (styleEl) {
			styleEl.remove();
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
						const details = wrapper.querySelector('details') as HTMLDetailsElement;
						if (details) {
							// Let the browser handle the toggle naturally (will trigger 'toggle' event)
							details.open = !details.open;
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

class toggle_tablesSettingTab extends PluginSettingTab {
	plugin: toggle_tablesPlugin;

	constructor(app: App, plugin: toggle_tablesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Toggleable Tables Settings' });

		// Basic Settings
		containerEl.createEl('h3', { text: 'Table Behavior' });

		new Setting(containerEl)
			.setName('Row Threshold')
			.setDesc('Tables with more than this many rows will be made toggleable')
			.addText(text => text
				.setPlaceholder('10')
				.setValue(this.plugin.settings.rowThreshold.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.rowThreshold = numValue;
						await this.plugin.saveSettings();
					}
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
					this.plugin.settings.customSummaryText = value || 'Click to expand table';
					await this.plugin.saveSettings();
				}));

		// Sound Settings
		containerEl.createEl('h3', { text: 'Sound Effects' });

		new Setting(containerEl)
			.setName('Enable Sounds')
			.setDesc('Play sounds when expanding/collapsing tables')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableSounds)
				.onChange(async (value) => {
					this.plugin.settings.enableSounds = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Sound Volume')
			.setDesc('Volume for sound effects (0-1)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.soundVolume)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.soundVolume = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Expand Sound (URL or local file path)')
			.setDesc('Used for both expand and collapse (collapse plays it reversed)')
			.addText(text => text
				.setPlaceholder('https://example.com/sound.mp3 OR file:///...')
				.setValue(this.plugin.settings.expandSoundUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.expandSoundUrl = value;
					await this.plugin.saveSettings();
				}));

		// Row Styling
		containerEl.createEl('h3', { text: 'Row Styling Options' });
		
		new Setting(containerEl)
			.setName('Alternating Row Colors')
			.setDesc('Enable alternating background colors for table rows')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.alternatingRowColors)
					.onChange(async (value) => {
						this.plugin.settings.alternatingRowColors = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Even Row Background')
			.setDesc('Background color for even-numbered rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.evenRowBackground)
					.onChange(async (value) => {
						this.plugin.settings.evenRowBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Odd Row Background')
			.setDesc('Background color for odd-numbered rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.oddRowBackground)
					.onChange(async (value) => {
						this.plugin.settings.oddRowBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Header Background')
			.setDesc('Background color for table headers')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.headerBackground)
					.onChange(async (value) => {
						this.plugin.settings.headerBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Header Text Color')
			.setDesc('Text color for table headers')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.headerTextColor)
					.onChange(async (value) => {
						this.plugin.settings.headerTextColor = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Hover Background')
			.setDesc('Background color when hovering over table rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.hoverBackground)
					.onChange(async (value) => {
						this.plugin.settings.hoverBackground = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Hover Text Color')
			.setDesc('Text color when hovering over table rows')
			.addColorPicker(color =>
				color
					.setValue(this.plugin.settings.hoverTextColor)
					.onChange(async (value) => {
						this.plugin.settings.hoverTextColor = value;
						await this.plugin.saveSettings();
					})
			);
	}
}/*/