# 🍒 Cada Letra — EveryLetter

> *"Quédate con las notas que te escribí porque cada letra las sentí muy en mi corazón :)"*

**Cada Letra** es un plugin de sincronización distribuida para [Obsidian](https://obsidian.md) que conecta tus bóvedas en tiempo real entre Desktop y Mobile usando CRDTs y Supabase.

---

## ✨ Características

- **Sincronización en tiempo real** — Tus notas se actualizan en vivo entre todos los dispositivos conectados a la misma clave.
- **Multiplataforma** — Desktop (Windows/Mac/Linux) y Mobile (Android/iOS) con bypass de CORS nativo.
- **CRDTs (Yjs)** — Resolución de conflictos sin pérdida de datos. Múltiples personas pueden editar simultáneamente.
- **Modo Manual** — Opción de sincronizar solo cuando tú lo decidas con un clic en la barra de estado.
- **Cementerio de notas** — El Oráculo (creador de la bóveda) nunca pierde archivos: los borrados remotos se guardan en `.cada-letra-cementerio`.
- **Roles distribuidos** — Sistema de roles: Oráculo (creador) y Satélites (invitados) con permisos diferenciados.
- **Persistencia local** — IndexedDB aislada por clave de bóveda. Tus datos sobreviven a reinicios.

## 🚀 Instalación

### Mediante BRAT (Recomendado)
1. Instala el plugin [BRAT](https://github.com/TfTHacker/obsidian42-brat) en Obsidian.
2. Agrega este repositorio: `AldraAV/Notes-EveryLetter`
3. Activa "Cada Letra" en Ajustes → Plugins de la comunidad.

### Manual
1. Descarga `main.js` y `manifest.json` desde la [última Release](https://github.com/AldraAV/Notes-EveryLetter/releases/latest).
2. Crea la carpeta `.obsidian/plugins/cada-letra-sync/` en tu bóveda.
3. Copia ambos archivos ahí.
4. Activa el plugin en Obsidian.

## ⚙️ Configuración

### Requisitos previos
- Una cuenta gratuita en [Supabase](https://supabase.com).
- Una tabla `everyletter_vaults` con columnas: `vault_id` (text, PK), `state_vector` (text), `owner` (text).
- Realtime activado en tu proyecto de Supabase.

### Primeros pasos
1. Haz clic en 🍒 en el sidebar izquierdo para abrir el Centro de Mando.
2. Asigna un **Nombre de dispositivo** (ej. `Laptop-Principal`).
3. Escribe una **Clave de bóveda** compartida (ej. `mi-clave-123`).
4. Haz clic en **Reconectar**.
5. En tu primer dispositivo: haz clic en **Push total** para subir tu bóveda a la nube.
6. En los demás dispositivos: usa la misma clave y haz clic en **Pull total** para descargar.

A partir de ahí, las notas se sincronizan automáticamente en modo En Vivo.

## 🔧 Modos de sincronización

| Modo | Comportamiento |
|------|----------------|
| ⚡ En Vivo | Los cambios se envían automáticamente 800ms después de dejar de escribir. |
| 📌 Manual | Sin envío automático. Haz clic en la barra de estado o usa el comando `Sincronizar nota actual manualmente`. |

## 🏛️ Roles

| Rol | Permisos |
|-----|----------|
| **Oráculo** | Control total. Los borrados remotos van al cementerio en vez de eliminarse. Puede obliterar la nube. |
| **Satélite** | Lectura/escritura normal. Los borrados remotos se ejecutan directamente. |

## 🛠️ Stack tecnológico

- **TypeScript** + Obsidian Plugin API
- **Yjs** — CRDTs para resolución de conflictos
- **Supabase** — Realtime (WebSocket) + Database (PostgreSQL)
- **IndexedDB** — Persistencia local aislada por clave

## 📄 Licencia

[MIT](LICENSE)

---

Hecho con 🍒 por [AldraAV](https://github.com/AldraAV)
