set -e
FROM=$1
TO=$2
NAME=$3
TIMES=$(python -c "import sys; a=float(sys.argv[1]); b=float(sys.argv[2]); print(' '.join('%.2f' % (a + i*0.5) for i in range(int(round((b-a)/0.5))+1)))" "$FROM" "$TO")
YV_OUT="$TEMP/klee/ours" YV_W=320 YV_H=180 node tools/youvid-shots.cjs frames kL33T4T4T4a $TIMES > /dev/null
python tools/klee-sheet.py ours "$FROM" "$TO" "tools/$NAME.png"
