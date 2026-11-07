# Imagen única: sirve para `make dev` y para el devcontainer de VS Code.
# El sitio no tiene dependencias npm; Node solo se usa para los scripts de validar, compilar y servir.
FROM node:22-bookworm-slim

ARG USER=arcade
ARG VOLUME=/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends git curl ca-certificates sudo less make \
    && rm -rf /var/lib/apt/lists/*

# Usuario sin privilegios (el usuario "node" de la imagen se renombra para conservar UID 1000)
RUN usermod -l $USER -d /home/$USER -m node \
    && groupmod -n $USER node \
    && echo "$USER ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Historial de bash persistente entre reconstrucciones del contenedor
RUN mkdir /commandhistory \
    && touch /commandhistory/.bash_history \
    && chown -R $USER /commandhistory \
    && echo "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" >> /home/$USER/.bashrc

WORKDIR $VOLUME
COPY --chown=$USER:$USER . .
USER $USER

EXPOSE 5180 4180
CMD ["node", "scripts/serve.mjs", ".", "5180"]
