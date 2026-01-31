#!/bin/bash
# Script to generate PNG icons from SVG
# Requires: inkscape or imagemagick with rsvg support

# Using ImageMagick (if available)
if command -v convert &> /dev/null; then
    convert -background none icon.svg -resize 16x16 icon16.png
    convert -background none icon.svg -resize 32x32 icon32.png
    convert -background none icon.svg -resize 48x48 icon48.png
    convert -background none icon.svg -resize 128x128 icon128.png
    echo "Icons generated with ImageMagick"
    exit 0
fi

# Using Inkscape (if available)
if command -v inkscape &> /dev/null; then
    inkscape -w 16 -h 16 icon.svg -o icon16.png
    inkscape -w 32 -h 32 icon.svg -o icon32.png
    inkscape -w 48 -h 48 icon.svg -o icon48.png
    inkscape -w 128 -h 128 icon.svg -o icon128.png
    echo "Icons generated with Inkscape"
    exit 0
fi

echo "Please install ImageMagick or Inkscape to generate PNG icons"
echo "Or use an online SVG to PNG converter"
exit 1
