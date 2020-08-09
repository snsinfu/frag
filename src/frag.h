#pragma once


struct settings {
    int width;
    int height;
    double scale;
    double fps;
    const char *title;
    const char *filename;
    const char *source;
};

int run(const struct settings *settings);
