#pragma once

#include <stddef.h>

#include "frag.h"


int load_file(const char *filename, char **pbuf, size_t *psize);
int load_settings(const char *source, struct settings *settings);
