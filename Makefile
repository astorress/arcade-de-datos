# Atajos. Todo corre dentro de Docker: no necesitas Node en tu máquina.
COMPOSE = docker compose -f .docker/docker-compose.yml
.PHONY: dev down check build preview

dev:      ## Levanta el sitio en http://localhost:5180 (los cambios se ven al recargar)
	$(COMPOSE) up --build

down:     ## Detiene el contenedor
	$(COMPOSE) down

check:    ## Valida los archivos de contenido
	$(COMPOSE) run --rm --no-deps arcade_datos node scripts/check.mjs

build:    ## Valida y compila el sitio en dist/
	$(COMPOSE) run --rm --no-deps arcade_datos node scripts/build.mjs

preview: build  ## Sirve dist/ en http://localhost:4180 (tal como quedará publicado)
	$(COMPOSE) run --rm --no-deps -p 4180:4180 arcade_datos node scripts/serve.mjs dist 4180
