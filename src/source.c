#include "source.h"

#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>


/**
 * Loads a file into a newly allocated buffer.
 *
 * @param   filename    Filename of the file to load.
 *
 * @param   pbuf        Returns buffer containing the file content. The caller
 *                      is responsible to free the memory. The buffer is always
 *                      nul-terminated.
 *
 * @param   psize       Returns the size of the file content. Does not include
 *                      the terminating nul character.
 *
 * @return  0 on success, or -1 on error.
 */
int
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


/**
 * Loads setting parameters from `#pragma` directives in GLSL source code.
 *
 * @param   source      GLSL source code to load parametes from.
 *
 * @param   settings    Returns setting parameters found. Parameters that do
 *                      not appear in the source code are left untouched.
 *
 * @return  0 on success, or -1 on failure.
 */
int
load_settings(const char *source, struct settings *settings)
{
    return 0;
}
