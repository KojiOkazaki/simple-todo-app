idf_component_register(
    SRCS "app.c" "button.c"
    INCLUDE_DIRS "include"
    REQUIRES audio display network ui storage driver
)
