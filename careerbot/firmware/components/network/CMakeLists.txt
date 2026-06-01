idf_component_register(
    SRCS "network.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_wifi esp_websocket_client json nvs_flash
)
