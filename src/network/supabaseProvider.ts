import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as Y from 'yjs';
import { SUPABASE_URL, SUPABASE_KEY } from '../env';

export class CadaLetraSupabaseProvider {
    private supabase: SupabaseClient;
    private channel: ReturnType<SupabaseClient['channel']>;
    
    // Callback para que la Malla visual del oráculo reaccione en pantalla 
    public onNodesUpdated: ((nodesList: string[]) => void) | null = null;

    constructor(private yDoc: Y.Doc, public vaultKey: string, public deviceName: string) {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        console.log(`🔥 Enlace Supabase preparado. Bóveda Candado [${vaultKey}]`);

        // Generamos el nombre del Canal basándonos en tu llave estricta
        // Esto crea un candado en la sala secreta de Realtime
        const channelId = `everyletter-sync-${vaultKey}`;
        
        this.channel = this.supabase.channel(channelId, {
            config: {
                broadcast: { ack: true },
                presence: { key: this.deviceName }
            },
        });

        this.subscribeToRealtime();
    }

    public disconnect() {
        if(this.channel) {
            this.supabase.removeChannel(this.channel);
        }
    }

    private subscribeToRealtime() {
        this.channel
            .on(
                'broadcast',
                { event: 'yjs-delta' },
                (payload) => {
                    const deltaData = payload.payload?.delta;
                    const originNode = payload.payload?.origin || 'Nodo_Desconocido';
                    
                    if (!deltaData) return;
                    if (originNode === this.deviceName) return; // Ignorar si es un eco fantasma de nosotros mismos
                    
                    console.log(`📲 [Red] Delta Externo de [${originNode}], Fusionando...`);
                    
                    // La red JSON solo entiende arrays puros, aquí reconvertimos a Binario Inmutable
                    const updateBinary = Uint8Array.from(deltaData);
                    
                    // Inyectamos el delta etiquetando el origen real en la 'transaction' de Yjs
                    try {
                        Y.applyUpdate(this.yDoc, updateBinary, originNode);
                    } catch(e) {
                         console.error("🧨 Fallo al aplicar Delta Externo (Requiere Quirófano severo):", e);
                    }
                }
            )
            .on(
                'presence',
                { event: 'sync' },
                () => {
                    const onlineState = this.channel.presenceState();
                    const conectados = Object.keys(onlineState);
                    console.log(`🌐 [Malla Viva] Dispositivos conectados ahora:`, conectados);
                    if (this.onNodesUpdated) {
                        this.onNodesUpdated(conectados);
                    }
                }
            )
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`🍒 Bóveda conectada. Registrando Malla M2M...`);
                    await this.channel.track({ device: this.deviceName, status: 'Online' });
                }
            });
    }

    // Método para disparar los deltas matemáticos por WebSocket
    public broadcastDelta(deltaUpdateData: number[]) {
        console.log(`📤 Lanzando Delta hacia Supabase como [${this.deviceName}]...`);
        this.channel.send({
            type: 'broadcast',
            event: 'yjs-delta',
            payload: { 
                origin: this.deviceName,
                delta: deltaUpdateData 
            },
        });
    }

    // --- OPERACIONES MAESTRAS DE NÚCLEO (BÓVEDA ENTARA) ---

    public async pushVault(vaultKey: string, stateArray: Uint8Array): Promise<void> {
        console.log(`☁️ Intentando cristalizar toda la bóveda [${vaultKey}] en Supabase DB...`);
        // Yjs produce arreglos inmensos. Convertimos a base64 para que Supabase no sufra.
        const base64Data = Buffer.from(stateArray).toString('base64');
        
        const { error } = await this.supabase
            .from('everyletter_vaults')
            .upsert({ 
                vault_id: vaultKey, 
                state_vector: base64Data, 
                owner: this.deviceName 
            }, { onConflict: 'vault_id' });

        if (error) {
            console.error("🧨 Fallo cardíaco al subir bóveda:", error);
            throw error;
        }
    }

    public async pullVault(vaultKey: string): Promise<Uint8Array | null> {
        console.log(`☁️ Localizando Núcleo Maestro [${vaultKey}] en el espacio sideral...`);
        const { data, error } = await this.supabase
            .from('everyletter_vaults')
            .select('state_vector')
            .eq('vault_id', vaultKey)
            .single();

        if (error || !data) {
            console.error("🧨 Bóveda no encontrada o base de datos no configurada.");
            return null;
        }
        
        // Decodificamos de vuelta a Matemáticas puras
        const restoredBuffer = Buffer.from(data.state_vector, 'base64');
        return new Uint8Array(restoredBuffer);
    }

    public async obliterateVault(vaultKey: string): Promise<void> {
        console.log(`💀 Destruyendo el Núcleo Maestro [${vaultKey}] del servidor profundo...`);
        const { error } = await this.supabase
            .from('everyletter_vaults')
            .delete()
            .eq('vault_id', vaultKey);
            
        if (error) throw error;
    }
}
