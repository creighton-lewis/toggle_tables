# Toggle Table Plugin for Obsidian

A plugin that automatically makes long tables toggleable with dropdown behavior in Obsidian, improving readability and organization of your notes.

## Features

- **Automatic Table Detection**: Tables with more than a configurable number of rows are automatically made toggleable
- **Customizable Settings**: Adjust row threshold, default collapse state, and summary text
- **Smooth Animations**: Beautiful expand/collapse animations with configurable speed
- **Command Palette Integration**: Manual commands to toggle tables and wrap tables in toggles
- **Responsive Design**: Works well on desktop and mobile devices
- **Dark Mode Support**: Automatically adapts to Obsidian's theme settings

## Installation

### Manual Installation

1. Download the latest release from the releases page
2. Extract the plugin folder to your vault's `.obsidian/plugins/` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Copy the built files to your vault's `.obsidian/plugins/toggleable-tables/` folder

## Usage

### Automatic Behavior

The plugin automatically detects tables with more than the configured number of rows (default: 10) and makes them toggleable. No additional markup is required.

### Manual Commands

- **Toggle Table Collapse**: Place your cursor in a table and use this command to toggle its collapse state
- **Wrap Table in Toggle**: Manually wrap a table in toggle markup

### Settings

Access settings via Settings → Community Plugins → Toggleable Tables:

- **Row Threshold**: Number of rows before a table becomes toggleable (default: 10)
- **Default Collapsed**: Whether tables should be collapsed by default
- **Show Row Count**: Display the number of rows in the toggle summary
- **Animation Speed**: Speed of expand/collapse animations in milliseconds
- **Custom Summary Text**: Text to display in the toggle summary

## Examples

### Basic Table (Automatically Toggleable)

```markdown
| Port | Protocol | Service | Description |
|------|----------|---------|-------------|
| 20/21 | TCP | FTP | File Transfer Protocol |
| 22 | TCP | SSH | Secure Shell |
| 23 | TCP | Telnet | Unencrypted remote access |
| 25 | TCP | SMTP | Email sending |
| 53 | TCP/UDP | DNS | Domain Name System |
| 80 | TCP | HTTP | Web browsing |
| 110 | TCP | POP3 | Email retrieval |
| 123 | UDP | NTP | Network Time Protocol |
| 143 | TCP | IMAP | Email management |
| 443 | TCP | HTTPS | Secure web browsing |
| 993 | TCP | IMAPS | Secure IMAP |
| 995 | TCP | POP3S | Secure POP3 |
```

This table will automatically become toggleable since it has more than 10 rows.

### Manual Toggle Wrapping

You can also manually wrap tables in toggle markup:

```markdown
<!-- toggle-table -->
| Column A | Column B |
|----------|----------|
| Value 1  | Value 2  |
| Value 3  | Value 4  |
<!-- /toggle-table -->
```

## Styling

The plugin includes modern, clean styling that integrates seamlessly with Obsidian's design:

- Smooth hover effects
- Consistent with Obsidian's color scheme
- Responsive design for mobile devices
- Print-friendly styles

## Development

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Structure

```
├── main.ts              # Main plugin logic
├── styles.css           # Plugin styles
├── manifest.json        # Plugin manifest
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── esbuild.config.mjs   # Build configuration
└── README.md           # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have feature requests, please open an issue on the GitHub repository.

## Changelog

### v1.0.0
- Initial release
- Automatic table detection and toggling
- Customizable settings
- Command palette integration
- Responsive design
- Dark mode support 
