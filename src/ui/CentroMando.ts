import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import EveryLetterPlugin from '../main';

export class CentroMandoTab extends PluginSettingTab {
    plugin: EveryLetterPlugin;

    constructor(app: App, plugin: EveryLetterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('cada-letra-settings');

        // ── HEADER ──────────────────────────────────────────────
        const header = containerEl.createDiv({ cls: 'setting-item' });
        header.style.flexDirection = 'column';
        header.style.alignItems = 'flex-start';
        header.style.borderBottom = 'none';
        header.style.paddingBottom = '0';

        const titleRow = header.createDiv();
        titleRow.style.display = 'flex';
        titleRow.style.justifyContent = 'space-between';
        titleRow.style.alignItems = 'center';
        titleRow.style.width = '100%';

        titleRow.createEl('h1', { text: '🍒 Cada Letra' });
        
        const badge = titleRow.createEl('span', {
            text: this.plugin.settings.userRole === 'Dios' ? '⚔ Oráculo' : '📡 Satélite'
        });
        badge.style.fontSize = '0.75em';
        badge.style.padding = '4px 12px';
        badge.style.borderRadius = '20px';
        badge.style.border = '1px solid var(--text-faint)';
        badge.style.color = 'var(--text-muted)';

        header.createEl('p', {
            text: '"Quédate con las notas que te escribí porque cada letra las sentí muy en mi corazón :)"',
            cls: 'setting-item-description'
        }).style.fontStyle = 'italic';

        // ── I. IDENTIDAD ────────────────────────────────────────
        new Setting(containerEl).setName('Identidad del nodo').setHeading();

        new Setting(containerEl)
            .setName('Nombre del dispositivo')
            .setDesc('Cómo se identifica este nodo en la malla (ej. Laptop-AldraAV).')
            .addText(text => text
                .setPlaceholder('Ej. Laptop-Personal')
                .setValue(this.plugin.settings.deviceName)
                .onChange(async (value) => {
                    this.plugin.settings.deviceName = value;
                    await this.plugin.saveSettings();
                }))
            .addButton(btn => btn
                .setButtonText('Reconectar')
                .setCta()
                .onClick(() => {
                    this.plugin.crdtEngine.activateNexo(
                        this.plugin.settings.vaultKey,
                        this.plugin.settings.deviceName
                    );
                    new Notice('🍒 Red reconectada con nueva identidad.');
                }));

        new Setting(containerEl)
            .setName('Clave de bóveda')
            .setDesc('Contraseña compartida que une a todos los dispositivos. Misma clave = misma red.')
            .addText(text => text
                .setPlaceholder('Ej. mi-clave-secreta')
                .setValue(this.plugin.settings.vaultKey)
                .onChange(async (value) => {
                    this.plugin.settings.vaultKey = value;
                    await this.plugin.saveSettings();
                }));

        // ── II. MODO DE SINCRONIZACIÓN ──────────────────────────
        new Setting(containerEl).setName('Frecuencia de latido').setHeading();

        new Setting(containerEl)
            .setName('Modo de sincronización')
            .setDesc('En Vivo: cada cambio se envía automáticamente. Manual: tú decides cuándo sincronizar.')
            .addDropdown(drop => drop
                .addOption('Live_Deltas', '⚡ En Vivo (Automático)')
                .addOption('Manual_Batch', '📌 Manual (Botón)')
                .setValue(this.plugin.settings.syncMode)
                .onChange(async (value: any) => {
                    this.plugin.settings.syncMode = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshStatusBar();
                }));

        // ── III. GESTIÓN DE BÓVEDA ──────────────────────────────
        new Setting(containerEl).setName('Gestión de bóveda en la nube').setHeading();

        new Setting(containerEl)
            .setName('Subir bóveda completa')
            .setDesc('Empuja TODO el estado de tus notas a Supabase. Te corona como Oráculo de esta clave.')
            .addButton(btn => btn
                .setButtonText('Push total')
                .setWarning()
                .onClick(async () => {
                    const original = btn.buttonEl.innerText;
                    btn.setButtonText('Subiendo...');
                    btn.setDisabled(true);
                    try {
                        await this.plugin.crdtEngine.pushVaultMassive(this.plugin.settings.vaultKey);
                        this.plugin.settings.userRole = 'Dios';
                        await this.plugin.saveSettings();
                        btn.setButtonText('✅ Cristalizado');
                        badge.textContent = '⚔ Oráculo';
                        new Notice('🍒 Bóveda subida. Eres el Oráculo.');
                    } catch(e) {
                        btn.setButtonText('Error');
                        new Notice('🧨 Fallo al subir bóveda. Revisa la consola.');
                    }
                    btn.setDisabled(false);
                    setTimeout(() => btn.setButtonText(original), 4000);
                }));

        new Setting(containerEl)
            .setName('Descargar bóveda remota')
            .setDesc('Baja el estado completo desde Supabase y materializa las notas en tu disco.')
            .addButton(btn => btn
                .setButtonText('Pull total')
                .onClick(async () => {
                    const original = btn.buttonEl.innerText;
                    btn.setButtonText('Descargando...');
                    btn.setDisabled(true);
                    try {
                        await this.plugin.crdtEngine.pullVaultMassive(this.plugin.settings.vaultKey);
                        this.plugin.settings.userRole = 'Actor_Critico';
                        await this.plugin.saveSettings();
                        btn.setButtonText('✅ Materializado');
                        badge.textContent = '📡 Satélite';
                        new Notice('🍒 Bóveda descargada y materializada.');
                    } catch(e) {
                        btn.setButtonText('Sin datos');
                        new Notice('🧨 No se encontró bóveda para esta clave.');
                    }
                    btn.setDisabled(false);
                    setTimeout(() => btn.setButtonText(original), 4000);
                }));

        // ── V. ARQUEOLOGÍA DE EMERGENCIA ────────────────────────
        new Setting(containerEl).setName('🏺 Arqueología de Emergencia').setHeading();
        containerEl.createEl('p', {
            text: 'Si perdiste contenido en una migración o sincronización fallida, estas herramientas intentan recuperarlo del estado interno del CRDT y del IndexedDB local.',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Volcar estado CRDT a archivo')
            .setDesc('Escribe el contenido de TODAS las notas que el motor Yjs conoce en ARQUEOLOGIA_DUMP.md. Útil para ver qué tiene/no tiene el CRDT en memoria.')
            .addButton(btn => btn
                .setButtonText('🏺 Volcar CRDT')
                .onClick(async () => {
                    btn.setButtonText('Volcando...');
                    btn.setDisabled(true);
                    try {
                        const vaultMap = this.plugin.crdtEngine.vaultMap;
                        let dump = `# 🏺 Arqueología — Dump del CRDT\n`;
                        dump += `> Generado: ${new Date().toISOString()}\n`;
                        dump += `> Total de archivos en Y.Doc: ${vaultMap.size}\n\n---\n\n`;

                        vaultMap.forEach((yText, path) => {
                            const content = yText.toString();
                            dump += `## 📄 ${path}\n`;
                            dump += `> **Tamaño:** ${content.length} caracteres\n\n`;
                            if (content.length > 0) {
                                dump += content + '\n\n';
                            } else {
                                dump += `> ⚠️ VACÍO — El CRDT no tiene contenido para este archivo.\n\n`;
                            }
                            dump += `---\n\n`;
                        });

                        const dumpPath = 'ARQUEOLOGIA_DUMP.md';
                        const existingFile = this.app.vault.getAbstractFileByPath(dumpPath);
                        if (existingFile) {
                            await this.app.vault.modify(existingFile as any, dump);
                        } else {
                            await this.app.vault.create(dumpPath, dump);
                        }
                        new Notice(`🏺 Dump completado. ${vaultMap.size} archivos en CRDT. Ver ARQUEOLOGIA_DUMP.md`);
                        btn.setButtonText('✅ Volcado');
                    } catch(e) {
                        new Notice('🧨 Error al volcar. Revisa la consola.');
                        btn.setButtonText('Error');
                    }
                    btn.setDisabled(false);
                    setTimeout(() => btn.setButtonText('🏺 Volcar CRDT'), 4000);
                }));

        new Setting(containerEl)
            .setName('Restaurar notas vacías desde CRDT')
            .setDesc('Para cada archivo en disco que pese 0 bytes pero exista en el CRDT con contenido, lo restaura. No toca archivos que ya tienen contenido.')
            .addButton(btn => btn
                .setButtonText('🔬 Restaurar')
                .setCta()
                .onClick(async () => {
                    btn.setButtonText('Analizando...');
                    btn.setDisabled(true);
                    let restored = 0;
                    let skipped = 0;
                    let noContent = 0;
                    try {
                        const vaultMap = this.plugin.crdtEngine.vaultMap;
                        for (const [path, yText] of vaultMap) {
                            const crdtContent = yText.toString();
                            if (crdtContent.length === 0) { noContent++; continue; }

                            const file = this.app.vault.getAbstractFileByPath(path);
                            if (file) {
                                const diskContent = await this.app.vault.read(file as any);
                                if (diskContent.length === 0) {
                                    await this.app.vault.modify(file as any, crdtContent);
                                    console.log(`[Arqueólogo]: Restaurado '${path}' (${crdtContent.length} chars)`);
                                    restored++;
                                } else {
                                    skipped++;
                                }
                            }
                        }
                        new Notice(`🍒 Restauración: ${restored} recuperados, ${skipped} ya tenían contenido, ${noContent} vacíos en CRDT.`);
                        btn.setButtonText(`✅ ${restored} restaurados`);
                    } catch(e) {
                        new Notice('🧨 Error en restauración. Revisa consola.');
                        btn.setButtonText('Error');
                    }
                    btn.setDisabled(false);
                    setTimeout(() => btn.setButtonText('🔬 Restaurar'), 5000);
                }));

        new Setting(containerEl)
            .setName('Listar bases de datos IndexedDB')
            .setDesc('Lista TODAS las bases IndexedDB. Si la versión anterior del plugin usó una clave distinta, encontrarás aquí la base original con tu contenido intacto.')
            .addButton(btn => btn
                .setButtonText('🗄️ Escanear IndexedDB')
                .onClick(async () => {
                    btn.setButtonText('Escaneando...');
                    btn.setDisabled(true);
                    try {
                        if (!('databases' in indexedDB)) {
                            new Notice('⚠️ No soportado. Abre DevTools (Ctrl+Shift+I) → Application → IndexedDB.');
                            console.log('[Arqueólogo]: Busca manualmente cada-letra-db-* en DevTools de Obsidian.');
                            btn.setButtonText('No soportado');
                            btn.setDisabled(false);
                            return;
                        }
                        const databases = await (indexedDB as any).databases();
                        const cadaLetraDbs = databases.filter((db: any) =>
                            db.name && (db.name.includes('cada-letra') || db.name.includes('everyletter') || db.name.includes('y-indexeddb'))
                        );

                        console.log('🏺 [Arqueólogo] TODAS las IndexedDB:', databases.map((d: any) => d.name));
                        console.log('🏺 [Arqueólogo] Bases de Cada Letra:', cadaLetraDbs);

                        let content = `# 🗄️ Escaneo de IndexedDB\n> ${new Date().toISOString()}\n\n`;
                        content += `## Todas las bases encontradas (${databases.length})\n\n`;
                        databases.forEach((db: any) => { content += `- \`${db.name}\` (v${db.version})\n`; });
                        content += `\n## Bases relacionadas con Cada Letra (${cadaLetraDbs.length})\n\n`;
                        if (cadaLetraDbs.length > 0) {
                            cadaLetraDbs.forEach((db: any) => { content += `- 🍒 \`${db.name}\` (v${db.version})\n`; });
                            content += `\n> Si ves una base distinta a \`cada-letra-db-${this.plugin.settings.vaultKey}\`, esa puede ser la base original de la v1.\n`;
                        } else {
                            content += `> No se encontraron bases con prefijo conocido.\n`;
                        }
                        content += `\n**Clave actual:** \`cada-letra-db-${this.plugin.settings.vaultKey}\`\n`;

                        const dumpPath = 'INDEXEDDB_SCAN.md';
                        const existingFile = this.app.vault.getAbstractFileByPath(dumpPath);
                        if (existingFile) {
                            await this.app.vault.modify(existingFile as any, content);
                        } else {
                            await this.app.vault.create(dumpPath, content);
                        }
                        new Notice(`🗄️ ${cadaLetraDbs.length} bases de Cada Letra. Ver INDEXEDDB_SCAN.md`);
                        btn.setButtonText('✅ Escaneado');
                    } catch(e) {
                        console.error('[Arqueólogo] Error:', e);
                        new Notice('🧨 Error. Revisa la consola (Ctrl+Shift+I)');
                        btn.setButtonText('Error');
                    }
                    btn.setDisabled(false);
                    setTimeout(() => btn.setButtonText('🗄️ Escanear IndexedDB'), 4000);
                }));

        // ── IV. PARLAMENTO (Solo para Oráculo) ──────────────────
        if (this.plugin.settings.userRole === 'Dios') {
            new Setting(containerEl).setName('Parlamento del Oráculo').setHeading();

            containerEl.createEl('p', {
                text: 'Solo tú como creador de esta bóveda tienes acceso a estas opciones.',
                cls: 'setting-item-description'
            });

            new Setting(containerEl)
                .setName('Malla de dispositivos')
                .setDesc('Nodos conectados en tiempo real bajo tu clave.');

            const nodesContainer = containerEl.createDiv();
            nodesContainer.style.padding = '10px 0';
            const nodesList = nodesContainer.createEl('div');
            nodesList.style.color = 'var(--text-muted)';
            nodesList.textContent = 'Esperando conexiones...';

            const engineProvider = (this.plugin.crdtEngine as any).supabaseProvider;
            if (engineProvider) {
                engineProvider.onNodesUpdated = (nodos: string[]) => {
                    nodesList.empty();
                    if (nodos.length === 0) {
                        nodesList.textContent = 'Sin dispositivos conectados.';
                        return;
                    }
                    nodos.forEach(nodeLabel => {
                        const item = nodesList.createDiv();
                        item.style.padding = '4px 0';
                        const isMe = nodeLabel === this.plugin.settings.deviceName;
                        item.textContent = `● ${nodeLabel}${isMe ? ' (Tú)' : ''}`;
                        item.style.color = isMe ? 'var(--interactive-accent)' : 'var(--text-normal)';
                    });
                };
            }

            new Setting(containerEl)
                .setName('Cementerio')
                .setDesc('Archivos borrados remotamente se guardan en .cada-letra-cementerio en vez de destruirse.')
                .addButton(btn => btn.setButtonText('Ver carpeta').onClick(() => {
                    new Notice('🍒 Busca la carpeta .cada-letra-cementerio en tu explorador de archivos.');
                }));

            new Setting(containerEl)
                .setName('Destruir bóveda de la nube')
                .setDesc('Elimina permanentemente todos los datos de tu clave en Supabase. Irreversible.')
                .addButton(btn => btn
                    .setButtonText('Obliterar')
                    .setWarning()
                    .onClick(async () => {
                        btn.setButtonText('Destruyendo...');
                        try {
                            await this.plugin.crdtEngine.obliterateVaultMassive(this.plugin.settings.vaultKey);
                            btn.setButtonText('💀 Aniquilado');
                            new Notice('Bóveda eliminada de la nube permanentemente.');
                        } catch(e) {
                            btn.setButtonText('Error');
                        }
                    }));
        }
    }
}
