# Dragón de madera

Web de la asociación granadina de juegos de mesa **Dragón de madera**, disponible en https://dragondemadera.com/.

## Despliegue local

Sigue estos pasos para desplegar la web en tu máquina local:

1.  **Clona el repositorio:**

    ##### HTTPS
    ```bash
    git clone https://github.com/asoc-dragondemadera/web.git
    cd web
    ```

    ##### SSH
    ```bash
    git clone git@github.com:asoc-dragondemadera/web.git
    cd web
    ```

2.  **Instala las dependencias:**
    ```bash
    cd frontend
    pnpm install
    ```

3.  **Inicia el servidor de desarrollo:**
    ```bash
    pnpm run dev
    ```

La web debería estar disponible en `http://localhost:3000`.