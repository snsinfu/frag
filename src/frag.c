#include "frag.h"

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>


static int load_file(const char *filename, char **pbuf, size_t *psize);


int
run_frag(const struct settings *settings)
{
    char *source;
    size_t source_size;

    if (load_file(settings->filename, &source, &source_size) == -1) {
        return -1;
    }

    free(source);

    return 0;
}

/*
 * Loads file into a newly allocated buffer. The returned buffer is always
 * nul-terminated. Returns -1 on error.
 */
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
