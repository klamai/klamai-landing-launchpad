import { Client } from 'npm:minio';
const MINIO_BUCKET = Deno.env.get('MINIO_BUCKET_NAME');
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const minioClient = new Client({
      endPoint: Deno.env.get('MINIO_ENDPOINT'),
      port: Deno.env.get('MINIO_PORT'),
      useSSL: true,
      accessKey: Deno.env.get('MINIO_ACCESS_KEY_ID'),
      secretKey: Deno.env.get('MINIO_SECRET_ACCESS_KEY'),
      forcePathStyle: true
    });
    let fileName;
    try {
      const body = await req.json();
      fileName = body.fileName;
      if (!fileName) {
        throw new Error("La propiedad 'fileName' es requerida en el cuerpo JSON.");
      }
    } catch (e) {
      return new Response(JSON.stringify({
        error: `Petición inválida: ${e.message}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Obteniendo stream de Node.js para: "${fileName}"`);
    // 1. Obtiene el stream de Node.js desde MinIO
    const nodeStream = await minioClient.getObject(MINIO_BUCKET, fileName);
    // 2. CREA EL ADAPTADOR: Convierte el stream de Node.js a un Web API ReadableStream
    const webApiStream = new ReadableStream({
      async start (controller) {
        // Itera sobre cada trozo (chunk) de datos del stream de Node
        for await (const chunk of nodeStream){
          // Mete el trozo de datos en nuestro nuevo stream compatible
          controller.enqueue(chunk);
        }
        // Cierra nuestro stream cuando el de Node haya terminado
        controller.close();
      },
      cancel () {
        // Si el cliente cancela la descarga, destruimos el stream de Node
        nodeStream.destroy();
      }
    });
    console.log(`Devolviendo Web API stream para: "${fileName}"`);
    // 3. Pasa el stream ADAPTADO y COMPATIBLE a la respuesta
    return new Response(webApiStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Error en la función:', error);
    const errorMessage = error.message.includes("does not exist") ? "El archivo no fue encontrado en el bucket." : error.message;
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: error.message.includes("does not exist") ? 404 : 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
