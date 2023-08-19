#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

int main(int argc, char *argv[])
{
    if (argc != 2)
    {
        printf("Usage: [filename...]");
        return 1;
    }

    //opening file
    FILE *file = fopen(argv[1], "r");
    if (file == NULL)
    {
        fclose(file);
        printf("Could not open file %s. \n", argv[1]);
        return 2;
    }
    unsigned char *bt = malloc(512); // variable to read bytes from image file
    char names[8];
    int count = 0;
    FILE *img;

    // reading through the file
    while (fread(bt, 512, 1, file))
    {
        // condition checking for new jpg file
        if ((bt[0] == 0xff && bt[1] == 0xd8 && bt[2] == 0xff) && ((bt[3] & 0xf0) == 0xe0))
        {
            if (count > 0)
            {
                fclose(img); // closing already existing file
            }

            sprintf(names, "%03i.jpg", count); // naming file with order

            img = fopen(names, "w"); // new file created

            if (img == NULL)
            {
                fprintf(stderr, "Couldnot create file %s. \n", names);
                fclose(img);
                free(bt);
                return 3;
            }

            count++;

        }

        if (count > 0)
        {
            fwrite(bt, 512, 1, img);
        }
    }
    fclose(file);
    fclose(img);
    free(bt);
    return 0;
}