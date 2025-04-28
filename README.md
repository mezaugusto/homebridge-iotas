# homebridge-iotas
- Based off of stevesample/homebridge-iotas-switch
- Based off of kpsuperplane/homebridge-iotas

## Changes
- Fixed support for IOTAS API changes (circa 2022)
- Fixed door showing up as a thermostat.
- Room Outlet Switch (WIP)

## Will not fix
The door status is broken on IOTAS's API (The door function, however, works just fine).

If you use the keypad or the door is configured to auto-lock, the lock state becomes desynced. 

As a result, Homekit will show "Locking..." even when the door is locked, and vice versa.

This problem is also observed on the first-party IOTAS app. (More research is needed for workarounds if any exist)

## Currently supports
- Switch
- Door (See [Will not fix](#will-not-fix))
- Outlet (Broken)
- Light (e.g., brightness levels)
- Thermostats

# Installation
1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-iotas`
3. Update your configuration file. See the sample below.

# NPM link / sideload (not published on npm)
1. `git clone [repo link]`
2. `cd homebridge-iotas-test`
3. `npm install typescript`
4. `npx tsc`
5. `npm link`
   
Then start Homebridge with the D flag `homebridge -D`

# Configuration
Configuration sample:

 ```javascript
"platforms": [
  {
    "platform" : "homebridge-iotas-test", // This is determined by the platform name under app/index.ts
    "name" : "Iotas",
    "username": "[My_iotas_username]",
    "password": "[My_iotas_password]",
    "unit": "[unit_name]" // optional, will default to the first one found
  }
]
```

# License
See LICENSE file
