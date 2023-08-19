#include "helpers.h"
#include <math.h>
#include <stdlib.h>

int limit(int RGB); // Function declaration for capping at 255

// Convert image to grayscale
void grayscale(int height, int width, RGBTRIPLE image[height][width])
{
    for (int i = 0; i < height; i++)
    {
        for (int k = 0; k < width; k++)
        {
            float avg = round((image[i][k].rgbtRed + image[i][k].rgbtGreen + image[i][k].rgbtBlue) / 3.000);
            image[i][k].rgbtRed = avg;
            image[i][k].rgbtGreen = avg;
            image[i][k].rgbtBlue = avg;
        }
    }
    return;
}

// Reflect image horizontally
void reflect(int height, int width, RGBTRIPLE image[height][width])
{
    for (int i = 0; i < height; i++)
    {
        for (int k = 0; k < width; k++)
        {
            RGBTRIPLE temp;
            if (k < width / 2)
            {
                temp = image[i][k];
                image[i][k] = image[i][width - 1 - k];
                image[i][width - 1 - k] = temp;
            }
        }
    }
    return;
}

// Blur image
void blur(int height, int width, RGBTRIPLE image[height][width])
{
    // variables used in function
    int sumb, sumr, sumg;
    float count;

    // Temporary table of colours to not alter the original image
    RGBTRIPLE temp[height][width];
    // iterating through the size of the image to  blur pixels
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            sumr = 0, count = 0, sumg = 0, sumb = 0;
            for (int k = -1; k < 2; k++)
            {
                if (j + k < 0 || j + k > width - 1) // skipping iteration if it goes out of the pic
                {
                    continue;
                }
                for (int h = -1; h < 2; h++)
                {
                    if (h + i < 0 || h + i > height - 1) // skipping if going out of pic
                    {
                        continue;
                    }

                    sumr += image[i + h][j + k].rgbtRed;
                    sumg += image[i + h][j + k].rgbtGreen;
                    sumb += image[i + h][j + k].rgbtBlue;
                    count++;
                }
            }
            temp[i][j].rgbtRed = round(sumr / count);
            temp[i][j].rgbtGreen = round(sumg / count);
            temp[i][j].rgbtBlue = round(sumb / count);
        }

    }
    // copying values in actual image
    for (int i = 0; i < height; i++)
    {
        for (int j = 0; j < width; j++)
        {
            image[i][j].rgbtRed = temp[i][j].rgbtRed;
            image[i][j].rgbtBlue = temp[i][j].rgbtBlue;
            image[i][j].rgbtGreen = temp[i][j].rgbtGreen;
        }
    }
    return;
}

//Function definiton for capping at 255
int limit(int RGB)
{
    if (RGB > 255)
    {
        RGB = 255;
    }
    return RGB;
}
// Detect edges
void edges(int height, int width, RGBTRIPLE image[height][width])
{
    // variables for storing sums
    float sumbx, sumrx, sumgx, sumry, sumby, sumgy, gx, gy;
    // temporary table of colours to protect the original image
    RGBTRIPLE temp[height][width];
    for (int i = 0; i < width; i++)
    {
        for (int j = 0; j < height; j++)
        {
            sumbx = 0, sumgx = 0, sumrx = 0, sumry = 0, sumby = 0, sumgy = 0;

            for (int k = -1; k < 2; k++)
            {
                if (j + k < 0 || j + k > height - 1)
                {
                    continue;
                }
                for (int l = -1; l < 2; l++)
                {
                    if (i + l < 0 || i + l > width - 1)
                    {
                        continue;
                    }

                    gx = (k + 1 * k - k * abs(l)); // finding the corresponding gx
                    gy = (l + 1 * l - l * abs(k)); // finding the corresponding gy

                    sumrx += image[j + k][i + l].rgbtRed * gx;
                    sumbx += image[j + k][i + l].rgbtBlue * gx;
                    sumgx += image[j + k][i + l].rgbtGreen * gx;
                    sumry += image[j + k][i + l].rgbtRed * gy;
                    sumby += image[j + k][i + l].rgbtBlue * gy;
                    sumgy += image[j + k][i + l].rgbtGreen * gy;
                }
            }
            // calculating the final values using gx and gy values
            temp[j][i].rgbtRed = limit(round(sqrt(sumrx * sumrx + sumry * sumry)));
            temp[j][i].rgbtBlue = limit(round(sqrt(sumbx * sumbx + sumby * sumby)));
            temp[j][i].rgbtGreen =  limit(round(sqrt(sumgx * sumgx + sumgy * sumgy)));
        }
    }
    // copying values from temporary table
    for (int i = 0; i < width; i++)
    {
        for (int j = 0; j < height; j++)
        {
            image[j][i].rgbtBlue = temp[j][i].rgbtBlue;
            image[j][i].rgbtGreen = temp[j][i].rgbtGreen;
            image[j][i].rgbtRed = temp[j][i].rgbtRed;
        }
    }
    return;
}
