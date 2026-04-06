<p align="center">
  <img src="https://github.com/homebridge/branding/raw/latest/logos/homebridge-wordmark-logo-vertical.png" height="150px">
</p>

<span align="center">

# Homebridge IOTAS V2

[![Downloads](https://img.shields.io/npm/dt/homebridge-iotas-v2)](https://www.npmjs.com/package/homebridge-iotas-v2)
[![Version](https://img.shields.io/npm/v/homebridge-iotas-v2)](https://www.npmjs.com/package/homebridge-iotas-v2)
[![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/hZubhrz)

[![GitHub issues](https://img.shields.io/github/issues/mezaugusto/homebridge-iotas)](https://github.com/mezaugusto/homebridge-iotas/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/mezaugusto/homebridge-iotas)](https://github.com/mezaugusto/homebridge-iotas/pulls)

</span>

## Homebridge plugin for IOTAS Smart Home

This [Homebridge](https://github.com/homebridge/homebridge) plugin exposes [IOTAS](https://www.iotashome.com/) smart home devices to Apple's [HomeKit](http://www.apple.com/ios/home/).

IOTAS is a smart apartment platform commonly found in multifamily residential buildings. This plugin allows you to control your IOTAS-connected devices through HomeKit, Siri, and the Home app.

### Supported Devices

| Device Type         | HomeKit Service | Features                         |
| ------------------- | --------------- | -------------------------------- |
| **Lights**          | Lightbulb       | On/Off, Brightness               |
| **Switches**        | Switch          | On/Off                           |
| **Outlets**         | Switch          | On/Off                           |
| **Door Locks**      | Lock Mechanism  | Lock/Unlock                      |
| **Thermostats**     | Thermostat      | Current/Target Temperature, Mode |
| **Battery Devices** | Battery         | Battery Level, Charging State    |

### Known Limitations

- **Door Lock Status**: The lock status polling from the IOTAS API can become desynced if you use the physical keypad or if the door auto-locks. HomeKit may show "Locking..." even when the door is already locked. This is an IOTAS API limitation also observed in their first-party app.

### Prerequisites

- A working [Homebridge](https://github.com/homebridge/homebridge) installation
- An IOTAS account with valid credentials
- Node.js 20.18.0 or later

### Installation

#### Via Homebridge Config UI X (Recommended)

1. Search for `homebridge-iotas-v2` in the Plugins tab
2. Click **Install**
3. Configure the plugin in the Settings

#### Via Command Line

```bash
npm install -g homebridge-iotas-v2
```

### Configuration

Add the following to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "homebridge-iotas-v2",
      "name": "IOTAS",
      "username": "your-email@example.com",
      "password": "your-password",
      "unit": "Unit Name"
    }
  ]
}
```

| Option     | Required | Description                              |
| ---------- | -------- | ---------------------------------------- |
| `platform` | Yes      | Must be `homebridge-iotas-v2`            |
| `name`     | Yes      | Display name for the platform            |
| `username` | Yes      | Your IOTAS account email                 |
| `password` | Yes      | Your IOTAS account password              |
| `unit`     | No       | Unit name (defaults to first unit found) |

### Troubleshooting

#### Debug Mode

Run Homebridge with debug logging enabled:

```bash
homebridge -D
```

This will show detailed logs including API requests and device discovery.

#### Common Issues

1. **No devices showing up**: Verify your IOTAS credentials are correct and that you can log into the IOTAS app.

2. **Wrong unit**: If you have access to multiple units, specify the `unit` name in your config.

3. **Devices not responding**: The IOTAS API may be temporarily unavailable. Check your internet connection and try restarting Homebridge.

#### Getting Help

- Check [existing issues](https://github.com/mezaugusto/homebridge-iotas/issues) on GitHub
- Open a [new issue](https://github.com/mezaugusto/homebridge-iotas/issues/new) with debug logs
- Join the [Homebridge Discord](https://discord.gg/hZubhrz) community

### Development

```bash
# Clone the repository
git clone https://github.com/mezaugusto/homebridge-iotas.git
cd homebridge-iotas

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Link for local development
npm link
homebridge -D
```

### Credits

- Forked from [SanTechIT/homebridge-iotas-test](https://github.com/SanTechIT/homebridge-iotas-test)
- Originally based on work by [stevesample](https://github.com/stevesample/homebridge-iotas-switch) and [kpsuperplane](https://github.com/kpsuperplane/homebridge-iotas)
- Built with the [Homebridge Plugin Template](https://github.com/homebridge/homebridge-plugin-template)

### License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
