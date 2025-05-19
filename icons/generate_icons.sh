#!/bin/bash

# 检查是否安装了 ImageMagick
if ! command -v convert &> /dev/null; then
    echo "请先安装 ImageMagick"
    echo "macOS: brew install imagemagick"
    echo "Ubuntu/Debian: sudo apt-get install imagemagick"
    exit 1
fi

# 生成不同尺寸的图标
convert -background none -size 16x16 icon.svg icon16.png
convert -background none -size 48x48 icon.svg icon48.png
convert -background none -size 128x128 icon.svg icon128.png

echo "图标生成完成！" 