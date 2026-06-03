// CareerBot device config (M5StopWatch ESP-IDF build).
#pragma once

#define WIFI_SSID    "your-wifi-ssid"
#define WIFI_PASS    "your-wifi-password"

// Full WebSocket URI to the relay on your Mac (use the Mac's LAN IP).
// Find the IP with:  ipconfig getifaddr en0
#define SERVER_URI   "ws://192.168.3.50:8090/ws"

#define DEVICE_ID    "stopwatch-01"
#define DEVICE_TOKEN "cb-dev-token"

// Optional on-screen credit line shown on the idle screen (UTF-8). Leave empty
// for none. Use this to attribute third-party assets per their license.
#define CREDIT_TEXT  ""
