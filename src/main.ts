import { Plugin, Notice, MarkdownView, TFile } from 'obsidian';
import { CRDTEngine } from './engine/crdt';
import { CentroMandoTab } from './ui/CentroMando';

interface EveryLetterSettings {
    deviceName: string;
    vaultKey: string;
    // Opciones de Poder y Gobierno
    userRole: 'Dios' | 'Actor_Critico' | 'Satelite_Sordo';
    syncMode: 'Live_Deltas' | 'Manual_Batch';
}

const DEFAULT_SETTINGS: EveryLetterSettings = {
    deviceName: '',
    vaultKey: '',
    userRole: 'Dios', // Tú empiezas asumiendo ser Dios local hasta pactar
    syncMode: 'Live_Deltas'
}

export default class EveryLetterPlugin extends Plugin {
    // Memoria nativa para la configuración (Device_Name y Key Dinámicos)
    settings: EveryLetterSettings;
    // El Sol de Cada Letra - Aurora Visual Ámbar Sunlight
    private statusBarItem: HTMLElement;
    private syncTimeout: NodeJS.Timeout | null = null;
    private crdtEngine: CRDTEngine;

    async onload() {
        // Absorber la configuración local (Las credenciales si ya estaban)
        await this.loadSettings();

        console.log(`☀️ Despertando el Noveno Hermano: Cada Letra (Nodo: ${this.settings.deviceName || 'Misterio'})`);
        
        // Inyectamos el Dashboard Premium en el centro del sistema
        this.addSettingTab(new CentroMandoTab(this.app, this));

        // Carga de la mente abstracta de sincronización
        this.crdtEngine = new CRDTEngine();
        // Le inyectamos los settings dinámicos que guardaste (o los defaults)
        this.crdtEngine.activateNexo(this.settings.vaultKey, this.settings.deviceName);

        // 0. FASE PRO: Inyección Visual y Recepción de Deltas Externos
        this.crdtEngine.onRemoteUpdate = async (path, fusedText, originNode) => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            // Si el archivo que vemos es exactamente el que llegó modificado desde la red
            if (view && view.file && view.file.path === path) {
                const currentCursor = view.editor.getCursor(); 
                view.editor.setValue(fusedText);
                view.editor.setCursor(currentCursor); 
                
                this.updateSyncStatus(`⚡ [${originNode}] tejió aquí`, '#FFBF00', '#1A0400');
                setTimeout(() => this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'), 3000);
            } else {
                // MATERIALIZACIÓN FÍSICA ASÍNCRONA
                // Si el archivo NO está abierto, o si acabamos de hacer un súper "Pull de Bóveda",
                // Obligamos al Disco Duro a reconocer la orden divina y escribir la nota
                const exactFile = this.app.vault.getAbstractFileByPath(path);
                
                if (exactFile instanceof TFile) {
                    await this.app.vault.modify(exactFile, fusedText);
                    console.log(`[Materializador]: El nodo [${originNode}] alteró '${path}' en segundo plano.`);
                } else if (!exactFile) {
                    // Si el archivo es virgen y viene de la nube, lo forjamos de la nada
                    try {
                        const folders = path.split('/');
                        if (folders.length > 1) {
                            // En Obsidian debes asegurar que las carpetas existen. 
                            // Omitiremos creación de carpetas por ahora asumiendo rutas root o simples.
                        }
                        await this.app.vault.create(path, fusedText);
                        console.log(`[Materializador]: Nació el nuevo archivo '${path}'.`);
                    } catch(e) {
                         console.error(`Fallo creando '${path}' en disco duro.`, e);
                    }
                }
            }
        };

        // 0.5. FUNDACIÓN DEL CEMENTERIO (El "No-Olvido")
        this.crdtEngine.onRemoteDelete = async (path, originNode) => {
            const exactFile = this.app.vault.getAbstractFileByPath(path);
            if (exactFile instanceof TFile) {
                if (this.settings.userRole === 'Dios') {
                    // Somos Dios. Nos negamos a borrarlo per sé.
                    // Renombramos la carpeta base hacia el cementerio ignoto.
                    const cementerioPath = '.cada-letra-cementerio';
                    const cementerioFolder = this.app.vault.getAbstractFileByPath(cementerioPath);
                    if (!cementerioFolder) {
                        try { await this.app.vault.createFolder(cementerioPath); }catch(e){}
                    }
                    
                    const fileName = exactFile.name;
                    // Limpiamos los dos puntos y agregamos un registro imborrable de timestamp
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const newPath = `${cementerioPath}/${timestamp}-${fileName}`;
                    
                    await this.app.vault.rename(exactFile, newPath);
                    this.updateSyncStatus(`💀 Salvado en Cementerio: [${originNode}] borró ${fileName}`, '#FC3F1D', '#1A0400');
                    console.log(`[Cementerio]: Negamos la muerte de ${path}. Renacido en ${newPath}.`);
                } else {
                    // Si somos un humilde satélite obedecemos el borrado asqueroso del administrador
                    await this.app.vault.trash(exactFile, true); 
                    this.updateSyncStatus(`💀 [${originNode}] purgó ${exactFile.name} de la bóveda`, '#FC3F1D', '#1A0400');
                }
            }
        };

        // 1. Añadir indicador a la barra de estado inferior
        this.statusBarItem = this.addStatusBarItem();
        
        // Setup Estética Core
        this.statusBarItem.style.fontWeight = "bold";
        this.statusBarItem.style.padding = "2px 8px";
        this.statusBarItem.style.borderRadius = "4px";
        this.statusBarItem.style.fontFamily = "'Space Grotesk', 'Syne', 'Inter', monospace";
        this.statusBarItem.style.transition = "background-color 0.3s ease, color 0.3s ease";
        
        // Estado base: sin cambios pendientes
        this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'); 

        // 2. Interceptar cuando modificas una nota (CRDT Deltas pronto aquí)
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor, info) => {
                const path = info.file?.path;
                if(!path) return;
                
                // "Cada letra las sentí..."
                console.log(`[Cada Letra] Cambio detectado en: ${path}`);
                
                // Obtenemos todo el texto actual del editor
                const currentText = editor.getValue();
                
                // Enchufamos la Ruta y el texto crudo al Quirófano Yjs
                this.crdtEngine.applyChanges(path, currentText);

                // Estado de sincronización en progreso: Naranja Fuerte
                this.updateSyncStatus('⚡ Aguanta un ratito más...', '#FF8C42', '#1A0400'); 
                
                // TODO: Envío CRDT a Supabase. Simulación de éxito por ahora:
                this.syncTimeout = setTimeout(() => {
                    // Sincronización exitosa: Amarillo Cálido
                    this.updateSyncStatus('☀️ ¡Así está la calabaza!', '#FFBF00', '#1A0400'); 
                    
                    // Volver al reposo
                    setTimeout(() => {
                        this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'); 
                    }, 3000);
                }, 1000);
            })
        );

        // 3. FASE MASIVA: El Ojo de Sauron (Escuchar la Bóveda Entera, no sólo los dedos)
        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                // Cuando nace una nueva nota, vacía o llena, avisamos al Y.Map
                if(file instanceof TFile && file.extension === 'md') {
                    const content = await this.app.vault.read(file);
                    this.crdtEngine.applyChanges(file.path, content);
                }
            })
        );
        this.registerEvent(
            this.app.vault.on('delete', (file) => {
                // Notificar corte topológico
                this.crdtEngine.deleteFile(file.path);
            })
        );
        this.registerEvent(
            this.app.vault.on('rename', async (file, oldPath) => {
                // Renombrar = Matar al ID anterior y engendrar el nuevo con su texto exacto
                if(file instanceof TFile && file.extension === 'md') {
                    this.crdtEngine.deleteFile(oldPath);
                    const content = await this.app.vault.read(file);
                    this.crdtEngine.applyChanges(file.path, content);
                }
            })
        );

        // 4. Comandos Auxiliares
        this.addCommand({
            id: 'everyletter-force-sync',
            name: 'Pulsar latido manual a la red',
            callback: () => {
                new Notice("🍒 EveryLetter: Latido forzado disparado a Supabase.");
                this.updateSyncStatus('📡 Conectando...', '#FF8C42', '#1A0400');
                setTimeout(() => this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'), 2500);
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onunload() {
        console.log('🌙 Cada Letra: Nodo desconectado.');
    }

    // Helper centralizado para estética Lava/Neón Ambar
    updateSyncStatus(text: string, bgColor: string, textColor: string) {
        this.statusBarItem.setText(` ${text} `);
        this.statusBarItem.style.backgroundColor = bgColor;
        this.statusBarItem.style.color = textColor;
    }
}
