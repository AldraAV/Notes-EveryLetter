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
        
        // La activación del observer (observeDeep) fue removida del constructor
        // y trasladada a la inicialización post-synced (Búnker Ámbar) para evitar
        // el bug crítico de reescritura de notas en disco con estados vacíos.
    }

    /**
     * Enchufa el motor a una constelación. Se llama al iniciar y al cambiar en Options.
     */
    activateNexo(vaultKey: string, deviceName: string) {
        if(!vaultKey) return;
        
        // Anclamos la memoria Yjs a la base de datos IndexedDB local aislando por clave de bóveda
        const dbId = `cada-letra-db-${vaultKey}`;
        const localProvider = new IndexeddbPersistence(dbId, this.yDoc);

        // ══════════════════════════════════════════════════════════
        // FIX CRÍTICO DE RACE CONDITION:
        // y-indexeddb carga el estado ASÍNCRONAMENTE. Si conectamos
        // a Supabase ANTES de que termine, los deltas remotos llegan
        // a un Y.Doc vacío y "ganan" la fusión CRDT, vaciando las
        // notas locales que aún no se habían cargado del IndexedDB.
        //
        // Solución: Bloquear Supabase hasta que 'synced' dispare.
        // ══════════════════════════════════════════════════════════
        localProvider.on('synced', () => {
            console.log(`📦 Búnker Ámbar [${dbId}] validado. Historial a salvo. Conectando a la red...`);
            
            // FIX DEFINITIVO: Activamos el vigilante de mutaciones HASTA QUE el IndexedDB
            // garantice que el Y.Map ya está cargado con su estado real.
            this.initObserver();

            // Solo AHORA, con el estado local cargado, conectamos al puente remoto
            if(this.supabaseProvider) {
                this.supabaseProvider.disconnect();
            }
            this.supabaseProvider = new CadaLetraSupabaseProvider(this.yDoc, vaultKey, deviceName);
        });
    }

    /**
     * Inicializa la vigilancia de cambios remotos.
     * Solo se llama tras asegurar que el estado del CRDT ya no es "vacío por falta de carga".
     */
    private initObserver() {
        this.vaultMap.observeDeep((events, transaction) => {
            if (transaction.origin === 'local') return; // Ignorar nuestros propios cambios

            const processedPaths = new Set<string>();

            events.forEach(event => {
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
     * Sincroniza el bloque tecleado. Ahora exige saber LA RUTA.
     */
    applyChanges(path: string, content: string) {
        // Envolver TODO en la transacción 'local' para que el observer no se confunda
        // y lo trate como un archivo remoto (lo cual provocaba que disparara un borrado).
        this.yDoc.transact(() => {
            let fileText;
            if (!this.vaultMap.has(path)) {
                // Inicializar el espacio del archivo en el multiverso CRDT si es nuevo
                fileText = new Y.Text();
                this.vaultMap.set(path, fileText);
            } else {
                fileText = this.vaultMap.get(path)!;
            }

            if (fileText.toString() !== content) {
                fileText.delete(0, fileText.length);
                fileText.insert(0, content);
            }
        }, "local");
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
