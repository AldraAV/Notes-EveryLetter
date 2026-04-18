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
    userRole: 'Dios',
    syncMode: 'Live_Deltas'
}

export default class EveryLetterPlugin extends Plugin {
    settings: EveryLetterSettings;
    private statusBarItem: HTMLElement;
    crdtEngine: CRDTEngine;

    // FASE 2 FRANKENSTEIN — Supresor de Eco Anti-Loop
    // Cuando la red escribe un archivo local, Obsidian dispara 'modify'.
    // Sin este Set, nuestro motor re-absorbería ese cambio y lo re-transmitiría
    // creando un loop infinito de deltas fantasma (eco de escritura).
    // Relay resuelve esto comparando contenido; nosotros bloqueamos por bandera temporal.
    private writingFromRemote: Set<string> = new Set();

    // Debounce para evitar lecturas vírgenes
    private modifyDebouncers: Record<string, ReturnType<typeof setTimeout>> = {};

    async onload() {
        await this.loadSettings();

        console.log(`☀️ Despertando el Noveno Hermano: Cada Letra (Nodo: ${this.settings.deviceName || 'Misterio'})`);
        
        // Dashboard Premium
        this.addSettingTab(new CentroMandoTab(this.app, this));

        // Motor CRDT
        this.crdtEngine = new CRDTEngine();
        this.crdtEngine.activateNexo(this.settings.vaultKey, this.settings.deviceName);

        // ================================================================
        // 0. RECEPCIÓN DE DELTAS REMOTOS → ESCRITURA LOCAL
        // ================================================================
        this.crdtEngine.onRemoteUpdate = async (path, fusedText, originNode) => {
            // Marcar el archivo como "siendo escrito por la red"
            // para que el listener de 'modify' lo ignore y no genere eco
            this.writingFromRemote.add(path);

            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.file && view.file.path === path) {
                const currentCursor = view.editor.getCursor(); 
                view.editor.setValue(fusedText);
                view.editor.setCursor(currentCursor); 
                
                this.updateSyncStatus(`⚡ [${originNode}] tejió aquí`, '#FFBF00', '#1A0400');
                setTimeout(() => this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'), 3000);
            } else {
                // MATERIALIZACIÓN FÍSICA ASÍNCRONA
                const exactFile = this.app.vault.getAbstractFileByPath(path);
                
                if (exactFile instanceof TFile) {
                    await this.app.vault.modify(exactFile, fusedText);
                    console.log(`[Materializador]: El nodo [${originNode}] alteró '${path}' en segundo plano.`);
                } else if (!exactFile) {
                    try {
                        // Forjar carpetas intermedias recursivamente
                        const folders = path.split('/');
                        if (folders.length > 1) {
                            let currentFolder = '';
                            for (let i = 0; i < folders.length - 1; i++) {
                                currentFolder += (currentFolder === '' ? '' : '/') + folders[i];
                                const folderExists = this.app.vault.getAbstractFileByPath(currentFolder);
                                if (!folderExists) {
                                    console.log(`[Arquitecto]: Forjando rama perdida '${currentFolder}'.`);
                                    await this.app.vault.createFolder(currentFolder);
                                }
                            }
                        }
                        await this.app.vault.create(path, fusedText);
                        console.log(`[Materializador]: Nació el nuevo archivo '${path}'.`);
                    } catch(e) {
                         console.error(`Fallo creando '${path}' en disco duro.`, e);
                    }
                }
            }

            // Limpiar la bandera de eco después de que Obsidian procese el evento
            setTimeout(() => {
                this.writingFromRemote.delete(path);
            }, 600);
        };

        // ================================================================
        // 0.5. CEMENTERIO (El "No-Olvido")
        // ================================================================
        this.crdtEngine.onRemoteDelete = async (path, originNode) => {
            const exactFile = this.app.vault.getAbstractFileByPath(path);
            if (exactFile instanceof TFile) {
                if (this.settings.userRole === 'Dios') {
                    const cementerioPath = '.cada-letra-cementerio';
                    const cementerioFolder = this.app.vault.getAbstractFileByPath(cementerioPath);
                    if (!cementerioFolder) {
                        try { await this.app.vault.createFolder(cementerioPath); }catch(e){}
                    }
                    
                    const fileName = exactFile.name;
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const newPath = `${cementerioPath}/${timestamp}-${fileName}`;
                    
                    await this.app.vault.rename(exactFile, newPath);
                    this.updateSyncStatus(`💀 Salvado en Cementerio: [${originNode}] borró ${fileName}`, '#FC3F1D', '#1A0400');
                    console.log(`[Cementerio]: Negamos la muerte de ${path}. Renacido en ${newPath}.`);
                } else {
                    await this.app.vault.trash(exactFile, true); 
                    this.updateSyncStatus(`💀 [${originNode}] purgó ${exactFile.name} de la bóveda`, '#FC3F1D', '#1A0400');
                }
            }
        };

        // ================================================================
        // 1. BARRA DE ESTADO ESTÉTICA
        // ================================================================
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.style.fontWeight = "bold";
        this.statusBarItem.style.padding = "2px 8px";
        this.statusBarItem.style.borderRadius = "4px";
        this.statusBarItem.style.fontFamily = "'Space Grotesk', 'Syne', 'Inter', monospace";
        this.statusBarItem.style.transition = "background-color 0.3s ease, color 0.3s ease";
        this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'); 

        // ================================================================
        // 2. DETECCIÓN DE CAMBIOS LOCALES EN EDITOR (Tecla por tecla)
        // ================================================================
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor, info) => {
                const path = info.file?.path;
                if(!path) return;
                if(path.startsWith('.cada-letra')) return;

                // Si estamos escribiendo desde la red, NO re-enviar
                if (this.writingFromRemote.has(path)) return;
                
                const currentText = editor.getValue();
                this.crdtEngine.applyChanges(path, currentText);

                this.updateSyncStatus('⚡ Aguanta un ratito más...', '#FF8C42', '#1A0400'); 
                setTimeout(() => {
                    this.updateSyncStatus('☀️ ¡Así está la calabaza!', '#FFBF00', '#1A0400'); 
                    setTimeout(() => {
                        this.updateSyncStatus('☀ / 🍒 Iguanas ranas', '#FFB703', '#1A0400'); 
                    }, 3000);
                }, 1000);
            })
        );

        // ================================================================
        // 3. OJO DE SAURON — Escuchar la Bóveda Entera (con Anti-Eco)
        // ================================================================
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    if (file.path.startsWith('.cada-letra')) return;
                    
                    // SUPRESOR DE ECO: Si la red está escribiendo este archivo, ignorar
                    if (this.writingFromRemote.has(file.path)) return;

                    // Debounce: esperar 400ms para que el archivo decante
                    if (this.modifyDebouncers[file.path]) {
                        clearTimeout(this.modifyDebouncers[file.path]);
                    }
                    
                    this.modifyDebouncers[file.path] = setTimeout(() => {
                        this.app.vault.read(file).then(content => {
                            this.crdtEngine.applyChanges(file.path, content);
                        });
                    }, 400);
                }
            })
        );

        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                if(file instanceof TFile && file.extension === 'md') {
                    if (file.path.startsWith('.cada-letra')) return;
                    // Esperar un momento para que Obsidian termine de escribir el archivo
                    setTimeout(async () => {
                        const content = await this.app.vault.read(file);
                        this.crdtEngine.applyChanges(file.path, content);
                    }, 300);
                }
            })
        );

        this.registerEvent(
            this.app.vault.on('delete', (file) => {
                if (file.path.startsWith('.cada-letra')) return;
                this.crdtEngine.deleteFile(file.path);
            })
        );

        this.registerEvent(
            this.app.vault.on('rename', async (file, oldPath) => {
                if(file instanceof TFile && file.extension === 'md') {
                    if (file.path.startsWith('.cada-letra')) return;
                    this.crdtEngine.deleteFile(oldPath);
                    const content = await this.app.vault.read(file);
                    this.crdtEngine.applyChanges(file.path, content);
                }
            })
        );

        // ================================================================
        // 4. COMANDOS AUXILIARES
        // ================================================================
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

    updateSyncStatus(text: string, bgColor: string, textColor: string) {
        this.statusBarItem.setText(` ${text} `);
        this.statusBarItem.style.backgroundColor = bgColor;
        this.statusBarItem.style.color = textColor;
    }
}
