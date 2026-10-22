export class RequestBodyError extends Error {
  status: 400 | 413;
  constructor(status: 400 | 413) {
    super(status === 413 ? "Request is too large." : "Invalid JSON request.");
    this.status = status;
  }
}

// Content-Length is optional and untrusted. Bound the bytes actually read so
// chunked requests cannot exhaust a Worker's memory before validation runs.
export async function readJsonBody(request: Request, maximumBytes = 8_000): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maximumBytes) throw new RequestBodyError(413);
  if (!request.body) throw new RequestBodyError(400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new RequestBodyError(413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new RequestBodyError(400); }
}
