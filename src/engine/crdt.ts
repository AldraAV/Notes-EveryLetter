import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { CadaLetraSupabaseProvider } from '../network/supabaseProvider';

export class CRDTEngine {
    // Almacenamos el documento Yjs base
    private yDoc: Y.Doc;
    // Y.Map es el índice topológico de TODA tu bóveda
    // Llave: Ruta (ej. "/lore/Lupe.md") -> Valor: Y.Text (Delta abstracto)
    public vaultMap: Y.Map<Y.Text>;

    private supabaseProvider: CadaLetraSupabaseProvider | null = null;
    // Interfaz asíncrona hacia Obsidian UI
    public onRemoteUpdate: ((path: string, fusedText: string, originName: string) => void) | null = null;
    public onRemoteDelete: ((path: string, originName: string) => void) | null = null;

    constructor() {
        this.yDoc = new Y.Doc();
        this.vaultMap = this.yDoc.getMap('everyletter-vault-map');
        
        console.log("🍒 Engine CRDT 'Cada Letra' inicializado matemáticamente.");

        // Disparamos actualizaciones a la Red en cuanto este documento genera deltas
        this.yDoc.on('update', (update) => {
            if (this.supabaseProvider) {
                // El 'update' es un Uint8Array. Se convierte a array base para volar por JSON a Supabase
                const arrayFormat = Array.from(update);
                this.supabaseProvider.broadcastDelta(arrayFormat);
            }
        });
        
        // observeDeep vigila TODA mutación remota:
        // Caso 1: Archivos nuevos/borrados (YMapEvent → event.keys tiene las rutas)
        // Caso 2: Texto editado dentro de un archivo existente (YTextEvent → event.path tiene la ruta)
        this.vaultMap.observeDeep((events, transaction) => {
            if (transaction.origin === 'local') return; // Ignorar nuestros propios cambios

            const processedPaths = new Set<string>();

            events.forEach(event => {
                // CASO 1: Cambios estructurales en el Map (crear/borrar archivos)
                if (event.target === this.vaultMap) {
                    const changedKeys = Array.from(event.keys.keys());
                    changedKeys.forEach(path => {
                        if (processedPaths.has(path)) return;
                        processedPaths.add(path);

                        const fileText = this.vaultMap.get(path as string);
                        if (fileText && this.onRemoteUpdate) {
                            console.log(`⚡ [Nuevo Archivo Remoto] '${path}' detectado.`);
                            this.onRemoteUpdate(path as string, fileText.toString(), transaction.origin as string);
                        } else if (!fileText && this.onRemoteDelete) {
                            console.log(`💀 [Borrado Remoto] '${path}' eliminado de la malla.`);
                            this.onRemoteDelete(path as string, transaction.origin as string);
                        }
                    });
                }

                // CASO 2: Cambios de CONTENIDO en un Y.Text existente (¡EDICIONES EN VIVO!)
                // event.path contiene la ruta relativa dentro del Y.Map.
                // Para Y.Text dentro del Map, event.path[0] es la key (ruta del archivo).
                if (event.path && event.path.length > 0) {
                    const filePath = event.path[0] as string;
                    if (processedPaths.has(filePath)) return;
                    processedPaths.add(filePath);

                    const fileText = this.vaultMap.get(filePath);
                    if (fileText && this.onRemoteUpdate) {
                        console.log(`⚡ [Edición En Vivo] '${filePath}' mutó remotamente. Inyectando...`);
                        this.onRemoteUpdate(filePath, fileText.toString(), transaction.origin as string);
                    }
                }
            });
        });
    }

    /**
     * Enchufa el motor a una constelación. Se llama al iniciar y al cambiar en Options.
     */
    activateNexo(vaultKey: string, deviceName: string) {
        if(!vaultKey) return;
        
        // Anclamos la memoria Yjs a la base de datos IndexedDB local Aislando por clave de bóveda
        // Si tienes 3 bóvedas de prueba en tu laptop, no cruzarán estados mutantes entre ellas
        const dbId = `cada-letra-db-${vaultKey}`;
        const localProvider = new IndexeddbPersistence(dbId, this.yDoc);
        localProvider.on('synced', () => {
            console.log(`📦 Búnker Ámbar [${dbId}] validado. Historial a salvo.`);
        });

        if(this.supabaseProvider) {
            // Destruir el puente viejo a la matrix antes de crear uno nuevo
            this.supabaseProvider.disconnect();
        }
        this.supabaseProvider = new CadaLetraSupabaseProvider(this.yDoc, vaultKey, deviceName);
    }

    /**
     * Sincroniza el bloque tecleado. Ahora exige saber LA RUTA.
     */
    applyChanges(path: string, content: string) {
        let fileText;
        if (!this.vaultMap.has(path)) {
            // Inicializar el espacio del archivo en el multiverso CRDT si es nuevo
            fileText = new Y.Text();
            this.vaultMap.set(path, fileText);
        } else {
            fileText = this.vaultMap.get(path)!;
        }

        if (fileText.toString() !== content) {
            // Etiquetamos 'local' para proteger loop de ecos
            this.yDoc.transact(() => {
                fileText.delete(0, fileText.length);
                fileText.insert(0, content);
            }, "local");
        }
    }

    /**
     * Eliminación Topológica: El nodo avisa a la red que un archivo ha sido borrado físicamente de aquí.
     */
    deleteFile(path: string) {
        if (this.vaultMap.has(path)) {
            console.log(`🧨 Cortando el hilo rojo: [${path}] eliminado de la malla local.`);
            // Al borrarlo del Map, Yjs detecta un "delete" de subdocumento y se sincroniza
            this.vaultMap.delete(path);
            // La "Rutina del Cementerio" para restaurarlo después vivirá en otra capa
        }
    }

    getDocumentState(): Uint8Array {
        // Este vector crudo es el que se enviará en el futuro por Supabase
        return Y.encodeStateAsUpdate(this.yDoc);
    }

    // --- PODERES MAESTROS DE BÓVEDA ---

    async pushVaultMassive(vaultKey: string) {
        // Empacar T-O-D-A la bóveda local (Cientos de archivos en Y.Map) en 1 solo pulso binario
        const fullState = Y.encodeStateAsUpdate(this.yDoc);
        if(this.supabaseProvider) {
            await this.supabaseProvider.pushVault(vaultKey, fullState);
        }
    }

    async pullVaultMassive(vaultKey: string) {
        if (!this.supabaseProvider) return;
        const incomingState = await this.supabaseProvider.pullVault(vaultKey);
        if (incomingState) {
            console.log(`⚡ Suministrando Sangre Remota a Obsidian...`);
            // Se le aplica el update total inyectándolo a la fuerza.
            Y.applyUpdate(this.yDoc, incomingState, 'Boveda_Pull');
        }
    }

    async obliterateVaultMassive(vaultKey: string) {
        if (!this.supabaseProvider) return;
        await this.supabaseProvider.obliterateVault(vaultKey);
    }
}
