#!/bin/bash

COLOR_MAGENTA=$(tput setaf 5 2>/dev/null)
COLOR_GREEN=$(tput setaf 2 2>/dev/null)
COLOR_BLUE=$(tput setaf 4 2>/dev/null)
COLOR_DEFAULT=$(tput sgr0 2>/dev/null)

EXEC_PATH=$(dirname $(readlink -f "$0"))
HOME_PATH=$EXEC_PATH/..
STEP=1
STEP_COUNT=2

cd $HOME_PATH

echo "${COLOR_MAGENTA}${STEP}/$STEP_COUNT:${COLOR_GREEN} No hay dependencias npm que instalar (sitio estático).${COLOR_DEFAULT}"
let STEP++

echo "${COLOR_MAGENTA}${STEP}/$STEP_COUNT:${COLOR_GREEN} Validando el contenido de ${COLOR_BLUE}content/${COLOR_DEFAULT}"
node scripts/check.mjs

echo ""
echo "${COLOR_GREEN}Listo. Comandos útiles dentro del contenedor:${COLOR_DEFAULT}"
echo "  ${COLOR_BLUE}npm run dev${COLOR_DEFAULT}      sitio en http://localhost:5180"
echo "  ${COLOR_BLUE}npm run check${COLOR_DEFAULT}    valida las misiones"
echo "  ${COLOR_BLUE}npm run build${COLOR_DEFAULT}    compila en dist/"
echo "  ${COLOR_BLUE}npm run preview${COLOR_DEFAULT}  compila y sirve dist/ en http://localhost:4180"
echo "$COLOR_DEFAULT"
