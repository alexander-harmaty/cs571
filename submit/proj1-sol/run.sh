#!/bin/sh

dir=$(cd "$(dirname "$0")" && pwd)
winDir=$(cygpath -w "$dir")
node "$winDir/src/Main.js"
