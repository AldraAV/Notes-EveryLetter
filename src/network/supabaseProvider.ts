import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as Y from 'yjs';
import { requestUrl, Platform } from 'obsidian';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';
import { SUPABASE_URL, SUPABASE_KEY } from '../env';

// ============================================================================
// OPERACIÓN FRANKENSTEIN V2 — customFetch inspirado en Relay/customFetch.ts
// https://github.com/No-Instructions/Relay/blob/main/src/customFetch.ts
//
// Relay demostró que usar requestUrl UNIVERSALMENTE (no solo en Mobile)
// es la única forma confiable de evadir tanto CORS en Capacitor
// como el bug de Electron #42419 en Desktop.
// ============================================================================

const obsidianFetch = async (
    url: RequestInfo | URL,
    config?: RequestInit,
): Promise<Response> => {
    const urlString = url instanceof URL ? url.toString() : (url as string);
    const method = config?.method || 'GET';

    // Supabase SDK puede mandar un objeto Headers nativo o un Record plano.
    // requestUrl solo acepta Record<string, string>, así que normalizamos.
    let headers: Record<string, string> = {};
    if (config?.headers) {
        if (config.headers instanceof Headers) {
            config.headers.forEach((value, key) => {
                headers[key] = value;
            });
        } else if (Array.isArray(config.headers)) {
            config.headers.forEach(([key, value]) => {
                headers[key] = value;
            });
        } else {
            headers = config.headers as Record<string, string>;
        }
    }

    // El body de Supabase viene como string JSON normalmente
    let body: string | ArrayBuffer | undefined = undefined;
    if (config?.body !== undefined && config?.body !== null) {
        if (typeof config.body === 'string') {
            body = config.body;
        } else if (config.body instanceof ArrayBuffer) {
            body = config.body;
        } else if (config.body instanceof Uint8Array) {
            body = config.body.buffer as ArrayBuffer;
        } else {
            // Fallback: convertir a string
            body = String(config.body);
        }
    }

    const requestParams: RequestUrlParam = {
        url: urlString,
        method: method,
        body: body,
        headers: headers,
        throw: false,
    };

    let response: RequestUrlResponse | undefined = undefined;
    try {
        response = await requestUrl(requestParams);
    } catch (error: any) {
        // Relay maneja errores de Electron con gracia en vez de explotar
        if (error?.message?.includes('net::ERR_FAILED')) {
            return new Response(JSON.stringify({ error: 'Network request failed' }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'content-type': 'application/json' }),
            });
        }
        throw error;
    }

    // Caso: respuesta vacía (DELETE exitoso, etc.)
    if (!response.arrayBuffer.byteLength) {
        return new Response(null, {
            status: response.status,
            statusText: response.status.toString(),
            headers: new Headers(response.headers),
        });
    }

    // Construir un Response REAL (no un objeto plano fake)
    // Relay demostró que Supabase necesita un Response nativo verdadero
    const fetchResponse = new Response(response.arrayBuffer, {
        status: response.status,
        statusText: response.status.toString(),
        headers: new Headers(response.headers),
    });

    // Override del método json() para que Supabase lo parsee correctamente
    const json = async () => {
        return JSON.parse(response!.text);
    };
    Object.defineProperty(fetchResponse, 'json', {
        value: json,
    });

    return fetchResponse;
};

// ============================================================================
// PROVEEDOR DE RED SUPABASE — Cada Letra
// ============================================================================

export class CadaLetraSupabaseProvider {
    private supabase: SupabaseClient;
    private channel: ReturnType<SupabaseClient['channel']>;
    
    // Callback para que la Malla visual del oráculo reaccione en pantalla 
    public onNodesUpdated: ((nodesList: string[]) => void) | null = null;

    constructor(private yDoc: Y.Doc, public vaultKey: string, public deviceName: string) {
        // Inyección UNIVERSAL del Fetch nativo de Obsidian (Desktop + Mobile)
        // Relay demostró que Electron también tiene bugs de red. 
        // No condicionar a Platform.isMobile.
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: { fetch: obsidianFetch as any }
        });
        
        console.log(`🔥 Enlace Supabase preparado. Bóveda Candado [${vaultKey}]`);

        // Generamos el nombre del Canal basándonos en tu llave estricta
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
                    if (originNode === this.deviceName) return;
                    
                    console.log(`📲 [Red] Delta Externo de [${originNode}], Fusionando...`);
                    
                    const updateBinary = Uint8Array.from(deltaData);
                    
                    try {
                        Y.applyUpdate(this.yDoc, updateBinary, originNode);
                    } catch(e) {
                         console.error("🧨 Fallo al aplicar Delta Externo:", e);
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

    // --- OPERACIONES MAESTRAS DE NÚCLEO (BÓVEDA ENTERA) ---

    public async pushVault(vaultKey: string, stateArray: Uint8Array): Promise<void> {
        console.log(`☁️ Intentando cristalizar toda la bóveda [${vaultKey}] en Supabase DB...`);
        // Convertimos a base64 de forma portable (sin Buffer de Node.js que no existe en Mobile)
        let binary = '';
        for (let i = 0; i < stateArray.byteLength; i++) {
            binary += String.fromCharCode(stateArray[i]);
        }
        const base64Data = btoa(binary);
        
        const { error } = await this.supabase
            .from('everyletter_vaults')
            .upsert({ 
                vault_id: vaultKey, 
                state_vector: base64Data, 
                owner: this.deviceName 
            }, { onConflict: 'vault_id' });

        if (error) {
            console.error("🧨 Fallo cardíaco al subir bóveda:", JSON.stringify(error));
            throw error;
        }
        console.log(`✅ Bóveda [${vaultKey}] cristalizada exitosamente.`);
    }

    public async pullVault(vaultKey: string): Promise<Uint8Array | null> {
        console.log(`☁️ Localizando Núcleo Maestro [${vaultKey}] en el espacio sideral...`);
        const { data, error } = await this.supabase
            .from('everyletter_vaults')
            .select('state_vector')
            .eq('vault_id', vaultKey)
            .single();

        if (error || !data) {
            console.error("🧨 Bóveda no encontrada:", JSON.stringify(error));
            return null;
        }
        
        // Decodificamos de vuelta de base64 de forma portable
        const binary = atob(data.state_vector);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
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
