import { App, Modal } from 'obsidian';
import { DEVICE_NAME } from '../env';

export class QuirofanoModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Envoltura principal del Quirófano
        const container = contentEl.createDiv({ cls: 'cada-letra-quirofano-wrapper' });
        
        // Estética cruda: "Lava/Ambar" para el panel dictatorial
        container.style.padding = '20px';
        container.style.border = '2px solid #FF8C42';
        container.style.borderRadius = '12px';
        container.style.backgroundColor = '#110200'; // Negro muy rojizo
        container.style.color = '#FFB703'; // El ámbar
        container.style.fontFamily = "'Space Grotesk', 'Inter', sans-serif";

        // Título Glorioso
        container.createEl('h1', { 
            text: '🍒 Quirófano Central: El Parlamento',
            attr: { style: 'color: #FFB703; border-bottom: 1px solid #FF8C42; padding-bottom: 8px;' }
        });

        // Identidad Absoluta
        const identity = container.createEl('h3', { text: `Autoridad Cero: [${DEVICE_NAME}]`});
        identity.style.color = '#FFFFFF';
        identity.style.marginTop = '15px';

        // Sección de Nodos Conectados
        container.createEl('h4', { text: '🌐 Malla de Nodos In-Vivo:', attr: { style: 'color: #FF8C42; margin-top: 25px;' } });
        
        const list = container.createEl('ul');
        list.style.color = '#FFBF00';
        list.createEl('li', { text: `🟢 ${DEVICE_NAME} (Este Dispositivo - Oráculo)` });
        // (El ecosistema de Supabase Presence se inyectaría aquí en el futuro real)

        // Sección Crítica: El Cementerio
        container.createEl('h4', { text: '🧨 Sala del Cementerio (Borrado Suave):', attr: { style: 'color: #FC3F1D; margin-top: 25px;' } });
        const dangerInfo = container.createEl('p', { 
            text: "Calma. No hay peticiones de destrucción por parte de nodos lejanos. Nadie puede borrar tus letras sin que apruebes el descarte aquí." 
        });
        dangerInfo.style.color = '#C9C9C9';
        dangerInfo.style.fontSize = '0.9em';
        dangerInfo.style.fontStyle = 'italic';
        
        // Botonera de Fuerza
        const forcePullBtn = container.createEl('button', { text: "Forzar Tsunami (Pull de Nube)" });
        forcePullBtn.style.marginTop = '25px';
        forcePullBtn.style.backgroundColor = '#FFB703';
        forcePullBtn.style.color = '#110200';
        forcePullBtn.style.border = 'none';
        forcePullBtn.style.padding = '10px 15px';
        forcePullBtn.style.cursor = 'pointer';
        forcePullBtn.style.fontWeight = 'bold';
        forcePullBtn.style.borderRadius = '5px';
        
        forcePullBtn.onclick = () => {
            forcePullBtn.innerText = "⏳ Absorbiendo el Universo...";
            // Emularíamos la consulta a Supabase.
            setTimeout(() => {
                forcePullBtn.innerText = "⚡ Bóveda Fusionada";
                forcePullBtn.style.backgroundColor = '#FC3F1D';
                forcePullBtn.style.color = '#FFF';
            }, 1000);
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
