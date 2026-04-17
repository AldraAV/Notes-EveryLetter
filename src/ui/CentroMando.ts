import { App, PluginSettingTab, Setting } from 'obsidian';
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

        // 1. FUNDAMENTOS ESTÉTICOS
        containerEl.style.fontFamily = "'Inter', 'Space Grotesk', sans-serif";
        containerEl.style.maxWidth = '750px';
        containerEl.style.margin = '0 auto';

        // HEADER ÉPICO
        const header = containerEl.createDiv({ cls: 'everyletter-mando-header' });
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.borderBottom = '1px solid rgba(255,183,3, 0.3)';
        header.style.paddingBottom = '15px';
        header.style.marginBottom = '30px';

        const titleWrapper = header.createDiv();
        titleWrapper.createEl('h1', { 
            text: 'Cada Letra', 
            attr: { style: 'margin:0; font-family: "Space Grotesk"; font-weight: 700; color: #FFB703; font-size: 2.2em; letter-spacing: -0.5px;' }
        });
        titleWrapper.createEl('span', { 
            text: 'Centro de Mando • Parlamento',
            attr: { style: 'margin:0; font-weight: 300; color: #888; font-size: 1em; letter-spacing: 2px; text-transform: uppercase;' }
        });

        const statusBadge = header.createDiv();
        statusBadge.innerText = `Rango Actual: [ ${this.plugin.settings.userRole} ]`;
        statusBadge.style.color = this.plugin.settings.userRole === 'Dios' ? '#FC3F1D' : '#FFB703';
        statusBadge.style.fontWeight = 'bold';
        statusBadge.style.padding = '5px 12px';
        statusBadge.style.border = '1px solid currentColor';
        statusBadge.style.borderRadius = '20px';
        statusBadge.style.fontSize = '0.85em';

        // LEMA SAGRADO
        const quote = containerEl.createEl('p', {
            text: `"Quédate con las notas que te escribí porque cada letra las sentí muy en mi corazón :)"`
        });
        quote.style.fontStyle = 'italic';
        quote.style.color = '#FFB703';
        quote.style.opacity = '0.7';
        quote.style.marginBottom = '35px';

        // SECCIÓN A: IDENTIDAD & NÚCLEO
        containerEl.createEl('h3', { text: 'I. Identidad del Nodo (Básico)', attr:{style:'font-weight: 600'} });
        
        new Setting(containerEl)
            .setName('Nombre del Dispositivo')
            .setDesc('Designa un nombre para reconocerte en la malla (Ej. Laptop Personal).')
            .addText(text => text
                .setPlaceholder('Ej. Obsidian-Main')
                .setValue(this.plugin.settings.deviceName)
                .onChange(async (value) => {
                    this.plugin.settings.deviceName = value;
                    await this.plugin.saveSettings();
                    this.plugin.crdtEngine.activateNexo(this.plugin.settings.vaultKey, this.plugin.settings.deviceName);
                }));

        new Setting(containerEl)
            .setName('Contraseña de Bóveda (Vault Key)')
            .setDesc('El servidor de Supabase usará esta llave como núcleo interconector.')
            .addText(text => text
                .setPlaceholder('Ej. Lupe-1706v...')
                .setValue(this.plugin.settings.vaultKey)
                .onChange(async (value) => {
                    this.plugin.settings.vaultKey = value;
                    await this.plugin.saveSettings();
                    this.plugin.crdtEngine.activateNexo(this.plugin.settings.vaultKey, this.plugin.settings.deviceName);
                }));

        // SECCIÓN B: MÉTODO DE SINCRONIZACIÓN
        const methodSection = containerEl.createDiv();
        methodSection.style.marginTop = '40px';
        methodSection.style.padding = '15px 0';
        methodSection.style.borderTop = '1px dashed #333';
        methodSection.style.borderBottom = '1px dashed #333';

        methodSection.createEl('h3', { text: 'II. Frecuencia de Latido', attr:{style:'margin-top:0; color: #FFB703; font-weight: 600'} });
        
        new Setting(methodSection)
            .setName('Modo de Transfusión de Red')
            .setDesc('Decide cómo recibe y envía letras CADA LETRA frente a la Nube Central.')
            .addDropdown(drop => drop
                .addOption('Live_Deltas', 'Transfusión en Vivo (Instant CRDT Deltas)')
                .addOption('Manual_Batch', 'Cruce Parlamentario (Pull/Push Requests)')
                .setValue(this.plugin.settings.syncMode)
                .onChange(async (value: any) => {
                    this.plugin.settings.syncMode = value;
                    await this.plugin.saveSettings();
                }));

        // SECCIÓN C: GESTIÓN MASIVA (DB PUSH/PULL)
        const opsWrapper = containerEl.createDiv();
        opsWrapper.style.marginTop = '40px';
        opsWrapper.style.padding = '25px';
        opsWrapper.style.backgroundColor = 'rgba(255, 183, 3, 0.03)';
        opsWrapper.style.borderRadius = '15px';
        opsWrapper.style.border = '1px solid rgba(255, 183, 3, 0.1)';

        opsWrapper.createEl('h3', { text: 'III. Creadores y Herejes (Nube DB)', attr:{style:'margin-top:0; color: #FFB703'} });
        
        const massPush = new Setting(opsWrapper)
            .setName('Forjar un Nuevo Núcleo Divino (Push Bóveda)')
            .setDesc('Subirías TODO tu disco directo a Supabase. Tú te coronas el Maestro y tu Vault_Key dictará la ley.');
            
        massPush.addButton(btn => btn
            .setButtonText('Upload Total (Crear Nube)')
            .onClick(async () => {
                const originalText = btn.buttonEl.innerText;
                btn.setButtonText('Empujando al vacío...');
                try {
                    await this.plugin.crdtEngine.pushVaultMassive(this.plugin.settings.vaultKey);
                    
                    // Asumir que ascendió a Dios al lograrlo el primero
                    this.plugin.settings.userRole = 'Dios';
                    await this.plugin.saveSettings();
                    statusBadge.innerText = `Rango Actual: [ Dios ]`;
                    statusBadge.style.color = '#FC3F1D';
                    
                    btn.setButtonText('Núcleo Cristalizado 🍒');
                    setTimeout(() => btn.setButtonText(originalText), 4000);
                } catch(e) {
                    btn.setButtonText('Fallo en DB');
                    setTimeout(() => btn.setButtonText(originalText), 4000);
                }
            }));
        // Estética Botón Creador
        massPush.controlEl.querySelector('button')!.style.backgroundColor = 'rgba(252, 63, 29, 0.2)';
        massPush.controlEl.querySelector('button')!.style.color = '#FC3F1D';
        massPush.controlEl.querySelector('button')!.style.borderColor = '#FC3F1D';

        const massPull = new Setting(opsWrapper)
            .setName('Unirse a una Bóveda (Descargar Historia)')
            .setDesc('¿Has llegado de fuera? Vacía el StateVector íntegro de Supabase a tu computadora y materializa los archivos físicos.');
            
        massPull.addButton(btn => btn
            .setButtonText('Descargar Vena Cósmica')
            .onClick(async () => {
                const originalText = btn.buttonEl.innerText;
                btn.setButtonText('Descargando Vector...');
                try {
                    await this.plugin.crdtEngine.pullVaultMassive(this.plugin.settings.vaultKey);
                    
                    // Quien baja como satélite se degrada
                    this.plugin.settings.userRole = 'Actor_Critico';
                    await this.plugin.saveSettings();
                    statusBadge.innerText = `Rango Actual: [ Satélite ]`;
                    statusBadge.style.color = '#FFB703';

                    btn.setButtonText('Bóveda Física Viva ☀');
                    setTimeout(() => btn.setButtonText(originalText), 4000);
                } catch(e) {
                    btn.setButtonText('Sin Registros DB');
                    setTimeout(() => btn.setButtonText(originalText), 4000);
                }
            }));

        // SECCIÓN D: EL PARLAMENTO DEL DIOS (CEMENTERIO Y PULL REQUESTS)
        if (this.plugin.settings.userRole === 'Dios') {
            const adminWrapper = containerEl.createDiv();
            adminWrapper.style.marginTop = '40px';
            adminWrapper.style.padding = '25px';
            adminWrapper.style.borderRadius = '15px';
            adminWrapper.style.border = '2px solid #FC3F1D';
            adminWrapper.style.boxShadow = '0px 0px 15px rgba(252, 63, 29, 0.1)';

            adminWrapper.createEl('h2', { text: '🏛️ El Parlamento Restringido', attr:{style:'margin-top:0; color: #FC3F1D; text-transform: uppercase; font-weight: 800; letter-spacing: 1px'} });
            adminWrapper.createEl('p', { text: 'Solo tú como Oráculo de esta Nube puedes ver e impartir justicia aquí.', attr:{style:'color:#CCC; font-size:0.9em; margin-bottom: 25px'} });

            new Setting(adminWrapper)
                .setName('Bandeja de Pull Requests')
                .setDesc('Satélites (Invitados) no pueden sobreescribir tus versos vitales. Ellos dejan Lotes Pendientes aquí.')
                .addButton(btn => btn
                    .setButtonText('Revisar (0) Pendientes')
                    .setDisabled(true));

            new Setting(adminWrapper)
                .setName('Malla de Sangre')
                .setDesc('Dispositivos conectados ahora y escuchando bajo esta clave. Tú tienes la suprema potestad de sus letras.')
                .addButton(btn => btn.setButtonText('Manejar Restricciones P2P (En Desarrollo)').setDisabled(true));
                
            // CREACIÓN VISUAL DE LA LISTA DE PARÁSITOS
            const mayaContainer = adminWrapper.createDiv();
            mayaContainer.style.background = '#0a0000';
            mayaContainer.style.border = '1px solid #330000';
            mayaContainer.style.padding = '15px';
            mayaContainer.style.marginTop = '15px';
            mayaContainer.style.borderRadius = '8px';
            mayaContainer.createEl('h4', { text: 'Satélites y Entidades In-Vivo', attr:{style:'color: #FC3F1D; margin-top:0'} });
            
            const listNodesDOM = mayaContainer.createEl('ul');
            listNodesDOM.style.listStyle = 'none';
            listNodesDOM.style.padding = '0';
            
            // Reñenganchar el listener dinámico si proveedor ya existe
            // (Si no existe ahora, se enganchará cuando activateNexo crezca de base el motor)
            const engineProvider = (this.plugin.crdtEngine as any).supabaseProvider;
            if (engineProvider) {
                engineProvider.onNodesUpdated = (nodos: string[]) => {
                    listNodesDOM.empty();
                    nodos.forEach(nodeLabel => {
                        const li = listNodesDOM.createEl('li');
                        li.style.color = '#fff';
                        li.style.marginBottom = '5px';
                        li.innerHTML = `<span style="color:#0f0; margin-right:8px;">●</span> ${nodeLabel}`;
                        if(nodeLabel === this.plugin.settings.deviceName) li.innerHTML += ' <i>(Tú)</i>';
                    });
                };
            }
                
            new Setting(adminWrapper)
                .setName('Sala del Cementerio')
                .setDesc('Los archivos que otros celulares "destruyan", caerán físicamente a la carpeta ignota (.cada-letra-cementerio) hasta que tú votes su eliminación final.')
                .addButton(btn => btn.setButtonText('Purgar / Restaurar Muertos').setDisabled(true));

            // EL BOTÓN DEL DERECHO AL OLVIDO
            const destroySet = new Setting(adminWrapper)
                .setName('Apagar el Sol (Destruir Nube Pública)')
                .setDesc('Borrará todo rastro de tu bóveda en Supabase. El historial flotante desaparecerá para siempre de internet. Nadie podrá descargar tus notas.')
                .addButton(btn => btn
                    .setButtonText('OBLITERAR NÚCLEO NUBE')
                    .onClick(async () => {
                        btn.setButtonText('Vaciando el cielo...');
                        try {
                            await this.plugin.crdtEngine.obliterateVaultMassive(this.plugin.settings.vaultKey);
                            btn.setButtonText('Nube Aniquilada 💀');
                            // No regresamos al texto original para dar contundencia de que todo acabó
                        } catch(e) {
                            btn.setButtonText('Fallo en Destrucción');
                        }
                    }));
            // Sangre al botón del fin
            const dangerBtn = destroySet.controlEl.querySelector('button');
            if (dangerBtn) {
                dangerBtn.style.backgroundColor = '#FC3F1D';
                dangerBtn.style.color = '#FFF';
                dangerBtn.style.borderColor = '#110200';
                dangerBtn.style.fontWeight = 'bold';
            }
        }
    }
}
