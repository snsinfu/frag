#include <assert.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <getopt.h>


struct options {
    int width;
    int height;
    double scale;
    double fps;
    const char *title;
    const char *filename;
};

static const struct options default_options = {
    .width = 500,
    .height = 500,
    .scale = 1.0,
    .fps = 60.0,
};

static void show_usage(void);
static int parse_options(int argc, char **argv, struct options *options);
static int parse_size(const char *str, int *width, int *height);
static int parse_scale(const char *str, double *scale);
static int parse_fps(const char *str, double *fps);
static int load_file(const char *filename, char **buf, size_t *size);


int
main(int argc, char **argv)
{
    struct options options = default_options;

    if (parse_options(argc, argv, &options) == -1) {
        fprintf(stderr, "use --help to see usage\n");
        exit(EXIT_FAILURE);
    }

    char *source;
    size_t source_len;
    if (load_file(options.filename, &source, &source_len) == -1) {
        exit(EXIT_FAILURE);
    }

    free(source);
}

static void
show_usage(void)
{
    static const char *usage =
        "usage: frag [-sxfth] <source>\n"
        "\n"
        "  <source>  filename of fragment shader source code\n"
        "\n"
        "options:\n"
        "  -s, --size <width>,<height>  surface size\n"
        "  -x, --scale <scale>          display scale\n"
        "  -f, --fps <fps>              frames per second\n"
        "  -t, --title <title>          window title\n"
        "  -h, --help                   show this help message and exit\n"
        "\n";

    fputs(usage, stdout);
}

static int
parse_options(int argc, char **argv, struct options *options)
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
            if (parse_size(optarg, &options->width, &options->height) == -1) {
                return -1;
            }
            break;

        case 'x':
            if (parse_scale(optarg, &options->scale) == -1) {
                return -1;
            }
            break;

        case 'f':
            if (parse_fps(optarg, &options->fps) == -1) {
                return -1;
            }
            break;

        case 't':
            options->title = optarg;
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
        fprintf(stderr, "missing <source> argument\n");
        return -1;
    }

    options->filename = argv[0];

    return 0;
}

static int
parse_size(const char *str, int *width, int *height)
{
    assert(width);
    assert(height);

    if (sscanf(str, "%d,%d", width, height) != 2) {
        fprintf(stderr, "bad size argument\n");
        return -1;
    }

    if (*width <= 0 || *height <= 0) {
        fprintf(stderr, "width and height must be positive\n");
        return -1;
    }

    return 0;
}

static int
parse_scale(const char *str, double *scale)
{
    assert(scale);

    errno = 0;
    char *end;
    *scale = strtod(str, &end);

    if (errno != 0 || *end != '\0') {
        fprintf(stderr, "bad scale argument\n");
        return -1;
    }

    if (*scale <= 0) {
        fprintf(stderr, "scale must be positive\n");
        return -1;
    }

    return 0;
}

static int
parse_fps(const char *str, double *fps)
{
    assert(fps);

    errno = 0;
    char *end;
    *fps = strtod(str, &end);

    if (errno != 0 || *end != '\0') {
        fprintf(stderr, "bad fps argument\n");
        return -1;
    }

    if (*fps <= 0) {
        fprintf(stderr, "fps must be positive\n");
        return -1;
    }

    return 0;
}

static int
load_file(const char *filename, char **pbuf, size_t *psize)
{
    FILE *file = NULL;
    char *buf = NULL;
    int retcode = -1;

    file = fopen(filename, "r");
    if (file == NULL) {
        fprintf(stderr, "error: failed to open file - %s\n", strerror(errno));
        goto cleanup;
    }

    size_t cap = 4096;
    size_t size = 0;

    buf = malloc(cap + 1);
    if (buf == NULL) {
        fprintf(stderr, "error: failed to allocate memory\n");
        goto cleanup;
    }

    for (;;) {
        size_t nread = fread(buf, 1, cap - size, file);
        size += nread;

        if (nread < cap - size) {
            if (feof(file)) {
                break;
            }
            fprintf(stderr, "error: failed to read from file - %s\n", strerror(errno));
            goto cleanup;
        }

        if (size == cap) {
            cap *= 2;
            void *newbuf = realloc(buf, cap + 1);
            if (newbuf == NULL) {
                fprintf(stderr, "error: failed to allocate memory\n");
                goto cleanup;
            }
            buf = newbuf;
        }
    }

    buf[size] = '\0';
    *pbuf = buf;
    *psize = size;
    retcode = 0;
    buf = NULL; // Do not free.

cleanup:
    fclose(file);
    free(buf);

    return retcode;
}
