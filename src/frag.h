#pragma once


struct settings {
    int width;
    int height;
    double scale;
    double fps;
    const char *title;
    const char *filename;
};

int run_frag(const struct settings *settings);
