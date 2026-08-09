# Lecciones Aprendidas y Registro de Errores — Promptometer

## Lecciones Recientes

### 1. Manejo de Cierres de Etiquetas HTML y Estructura de Vistas (`.view`)
- **Problema**: Cierres prematuros de etiquetas `</div>` en secciones dentro de `#view-analyzer` provocaban que los elementos subsecuentes (como la Constelación 8D) se salieran del contenedor `#view-analyzer` y permanecieran visibles al cambiar a *Templates*, *Historial*, *Aprender*, etc.
- **Regla**: Siempre verificar la jerarquía completa de etiquetas en `index.html` tras mover o reestructurar bloques grandes de HTML. Asegurar que todo elemento pertenezca estrictamente a su contenedor de vista.

### 2. Flexbox y Desbordamiento en Móviles (`min-width: 0` & `box-sizing`)
- **Problema**: Selectores con textos largos (`<option>`) en contenedores flex causaban que el ancho mínimo auto del hijo expandiera la tarjeta contenedora por encima del ancho del viewport en dispositivos móviles.
- **Regla**: Aplicar siempre `flex: 1; min-width: 0; width: 100%; box-sizing: border-box;` en selectores y campos dentro de tarjetas flex en interfaces responsivas.

### 3. Política Estricta de Despliegue Local
- **Regla**: Todo desarrollo o prototipo nuevo se ejecuta exclusivamente en servidor local (`http://localhost:3001`). No realizar `git push` a `dev` ni a `main` sin consentimiento previo explícito del usuario.
