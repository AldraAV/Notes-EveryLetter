# Persistencia Ámbar (IndexedDB local-first)

En el Aldraverse, la integridad de "Nona" y los demás proyectos recae en que nada se pierda. La filosofía *Local-first* de **Cada Letra** dicta que Obsidian es el dueño absoluto y la base de datos maestra. 

Este documento explica cómo el Noveno Hermano (EveryLetter) procesa la persistencia de datos cuando **no hay conexión a internet (o Supabase falla)**.

## ¿Qué es el "Búnker Offline"?
Es la implementación de `y-indexeddb`. IndexedDB es una base de datos local que vive dentro del motor Chromium encapsulado de Obsidian.

Cuando escribes en el editor de Obsidian, ocurre este ciclo **silenciosamente**:
1. Escribes "Iguanas ranas".
2. `crdt.ts` intercepta la frase y la vuelve un "Delta matemático" en memoria RAM.
3. El `IndexeddbPersistence` atrapa ese Delta en milisegundos y lo escribe en el disco duro bajo la tabla compartida `'everyletter-vault'`.

## ¿Por qué es Vital?
Si tu computadora se apaga de golpe (blue screen) o cierras Obsidian antes de que el celular haya podido sincronizarse, los Deltas matemáticos no se perderán. Yjs tiene la mala costumbre de ser un protocolo "en memoria". Al conectarle IndexedDB, aseguramos que la próxima vez que abras Obsidian, **Cada Letra volverá a reconstruir tu documento histórico idéntico a la última tecla que tocaste.**

## Beneficios
- **Invulnerabilidad Offline:** Edita durante semanas sin internet. Cuando regreses a Supabase, el Búnker escupirá todos los deltas acumulados sin corromper nada.
- **Rápida inyección:** Mantiene tu historial de cambios para deshacer conflictos con precisión quirúrgica.
