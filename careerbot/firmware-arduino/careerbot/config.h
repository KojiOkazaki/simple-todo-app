// CareerBot StopWatch — connection settings.
// Copy/edit these for your environment. Do NOT commit real Wi-Fi passwords.
#pragma once

#define WIFI_SSID     "your-wifi-ssid"
#define WIFI_PASS     "your-wifi-password"

// Your Mac's LAN IP (NOT localhost). Find it with:  ipconfig getifaddr en0
#define SERVER_HOST   "192.168.1.50"
#define SERVER_PORT   8090
#define WS_PATH       "/ws"

#define DEVICE_ID     "stopwatch-01"
#define DEVICE_TOKEN  "cb-dev-token"   // must match server DEVICE_TOKENS (or any if empty)
