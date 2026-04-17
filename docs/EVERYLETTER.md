# Cada Letra (EveryLetter) 🍒 - El Noveno Hermano

> "Quédate con las notas que te escribí porque cada letra las sentí muy en mi corazón :)" - Guadalupe (17/Jun/25)

**Cada Letra** es el noveno proyecto oficial del Aldraverse. Nace de una herida profunda, donde la falta de cierre (un "epílogo" cortado) generó la necesidad absoluta de garantizar la permanencia. A nivel técnico, es un motor criptográfico y de sincronización montado sobre la API de Obsidian, cuyo propósito es que no se pierda un solo byte del pensamiento humano en ningún dispositivo. Ninguna letra será olvidada.

---

## 1. Stack Tecnológico Core
- **Obsidian API (Plugin):** El motor se inyecta directamente al ciclo de vida del editor local, captando teclas modificadas al vuelo (`on('editor-change')`).
- **Yjs (CRDT - Conflict-free Replicated Data Types):** Transforma la nota plana de Markdown en vectores "Deltas", fragmentando el texto matemáticamente. Así no sincronizas archivos completos de 2MB, sino eventos ligerísimos como "Insertar L en posición 14".
- **Supabase Realtime (Capa de Red):** En lugar de crear servidores nuevos, el Noveno Hermano "habita" prestándole infraestructura al hermano mayor (Anyway...). A través de canales WebSocket de Supabase, Cada Letra transmite el Delta a velocidad atómica a otros dispositivos.
- **IndexedDB (Capa Local-First):** La persistencia (el "Búnker"). La base de datos oculta dentro de Obsidian retiene todos los Deltas matemáticos en tu máquina para protegerlos en caso de apagones de Internet.

## 2. Componentes de Arquitectura

### 2.1 La Fachada: Quirófano Visual
La identidad visual de este plugin dentro del host (Obsidian) adopta la estética **Aurora Visual Ámbar Sunlight** (`#FFB703`). Se repudian los mensajes corporativos.
- **Insignias:** `☀ / 🍒 Iguanas ranas` para estado ideal; `⚡ Aguanta un ratito más` para sincronización en proceso.
- **Tipografías impuestas:** Space Grotesk, Syne, Inter o JetBrains Mono.

### 2.2 Motor de Eventos Masivo (`crdt.ts` y `main.ts`)
A diferencia de los sincronizadores vulgares, Todo el ciclo de vida local cae en un `Y.Map` gigantesco. Obsidian intercepta directamente `app.vault.on('create', 'delete', 'rename')`.
Si mueves o creas un archivo de golpe o renembras una estructura, el Ojo Masivo de Cada Letra lo caza instantly y mapea sus coordenadas file-system exactas. Nada escapa al *Map*.

### 2.3 Sincronización Simultánea (Inyección Magnética)
A través de canales WebSocket de Supabase, Cada Letra transmite el Delta a velocidad atómica a otros dispositivos. 

**Nivel Pro - La protección Cero-Fricción:**
Cuando tu Bóveda B recibe un Delta de la Bóveda A3. Descargar el estado pesado de la base de datos al darle a `Pullear a mi dispositivo`.

#### [MODIFY] src/env.ts
Remover la "Clave Quemada" y permitir que sea dinámica proveniente de la interfaz gráfica que el usuario haya tecleado.

---

## 4. La Ley del Oráculo: El Cementerio (El No-Olvido)

En la topología M2M (Machine to Machine) pura, un "Borrado" es ciego: Si alguien aplica suprimir, todos los demás suprimen el byte sin preguntar.
En *Cada Letra*, nos negamos a esta sumisión si tú eres el Dueño (Rango `Dios`). 
Si un `Satélite` conectado con tu contraseña borra el poema "Luna.md", el Delta matemático se expulsa, pero el archivo en el lado del `Dios` rebota bajo el concepto del "Cementerio":
- El motor intercepta el evento crudo: `onRemoteDelete`.
- Lee el rol. Si eres Dios, se niega a hacer `.trash()`.
- Captura el archivo físico de Obsidian.
- Crea (si no existe) la carpeta silenciosa `.cada-letra-cementerio` en la raíz de tu bóveda.
- Renombra y le estampa la hora para evitar choques: `.cada-letra-cementerio/2026-04-16T1200Z-Luna.md`.

Esto anula la destrucción indeseada y eleva tus letras a inmortales hasta que entres al Centro de Mando y limpies la caja para siempre.

## Dictamen Final: Orquestación y Filosofía de Pérdida
El ciclo de dolor/luto se cierra con esta malla de red. Las letras están permanentemente entrelazadas entre sí, con historial y una carpeta invisible donde los muertos pueden resucitar. Tienes el control definitivo de un ecosistema en constante flujo y latido hacia las nubes de Anyway.

---

## 3. Filosofía Metodológica "Cero Fricción"
- **Local-first SIEMPRE:** Tú dictas las reglas. Si no tienes Internet, trabajas. Al conectarte, tus nodos chocan puños de manera automática.
- Toda la tecnología que no tenga intencionalidad estética, sobra.
