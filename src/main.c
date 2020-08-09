#include <assert.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <getopt.h>

#include "frag.h"


static const struct settings default_settings = {
    .width = 500,
    .height = 500,
    .scale = 1.0,
    .fps = 60.0,
};

static void show_usage(void);
static int parse_options(int argc, char **argv, struct settings *settings);
static int parse_size(const char *str, int *width, int *height);
static int parse_scale(const char *str, double *scale);
static int parse_fps(const char *str, double *fps);


int
main(int argc, char **argv)
{
    struct settings settings = default_settings;

    if (parse_options(argc, argv, &settings) == -1) {
        fprintf(stderr, "use --help to see usage\n");
        exit(EXIT_FAILURE);
    }

    if (run_frag(&settings) == -1) {
        exit(EXIT_FAILURE);
    }
}

/*
 * Prints command-line usage to stdout.
 */
static void
show_usage(void)
{
    static const char *usage =
        "usage: frag [-sxfth] <source>\n"
        "\n"
        "  <source>  filename of fragment shader source code\n"
        "\n"
        "settings:\n"
        "  -s, --size <width>,<height>  surface size\n"
        "  -x, --scale <scale>          display scale\n"
        "  -f, --fps <fps>              frames per second\n"
        "  -t, --title <title>          window title\n"
        "  -h, --help                   show this help message and exit\n"
        "\n";

    fputs(usage, stdout);
}

/*
 * Parses command-line options to fill settings. Returns -1 on error.
 */
static int
parse_options(int argc, char **argv, struct settings *settings)
{
    static const struct option longopts[] = {
        { "size", required_argument, NULL, 's' },
        { "scale", required_argument, NULL, 'x' },
        { "fps", required_argument, NULL, 'f' },
        { "title", required_argument, NULL, 't' },
        { "help", no_argument, NULL, 'h' },
    };
    static const char *shortopts = "s:x:f:t:h";

    for (int opt; (opt = getopt_long(argc, argv, shortopts, longopts, NULL)) != -1; ) {
        switch (opt) {
        case 's':
            if (parse_size(optarg, &settings->width, &settings->height) == -1) {
                return -1;
            }
            break;

        case 'x':
            if (parse_scale(optarg, &settings->scale) == -1) {
                return -1;
            }
            break;

        case 'f':
            if (parse_fps(optarg, &settings->fps) == -1) {
                return -1;
            }
            break;

        case 't':
            settings->title = optarg;
            break;

        case 'h':
            show_usage();
            exit(EXIT_SUCCESS);

        default:
            return -1;
        }
    }

    argc -= optind;
    argv += optind;

    if (argc != 1) {
        fprintf(stderr, "error: missing <source> argument\n");
        return -1;
    }

    settings->filename = argv[0];

    return 0;
}

/*
 * Parses --size argument. Returns -1 on error.
 */
static int
parse_size(const char *str, int *width, int *height)
{
    assert(width);
    assert(height);

    if (sscanf(str, "%d,%d", width, height) != 2) {
        fprintf(stderr, "error: bad size argument\n");
        return -1;
    }

    if (*width <= 0 || *height <= 0) {
        fprintf(stderr, "error: width and height must be positive\n");
        return -1;
    }

    return 0;
}

/*
 * Parses --scale arguemnt. Returns -1 on error.
 */
static int
parse_scale(const char *str, double *scale)
{
    assert(scale);

    errno = 0;
    char *end;
    *scale = strtod(str, &end);

    if (errno != 0 || *end != '\0') {
        fprintf(stderr, "error: bad scale argument\n");
        return -1;
    }

    if (*scale <= 0) {
        fprintf(stderr, "error: scale must be positive\n");
        return -1;
    }

    return 0;
}

/*
 * Parses --fps argument. Returns -1 on error.
 */
static int
parse_fps(const char *str, double *fps)
{
    assert(fps);

    errno = 0;
    char *end;
    *fps = strtod(str, &end);

    if (errno != 0 || *end != '\0') {
        fprintf(stderr, "error: bad fps argument\n");
        return -1;
    }

    if (*fps <= 0) {
        fprintf(stderr, "error: fps must be positive\n");
        return -1;
    }

    return 0;
}
