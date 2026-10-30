export interface SmtpConfig {
  host: string;
  username: string;
  password: string;
}

export interface SmtpMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
}

interface SmtpSocket {
  opened: Promise<unknown>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void>;
}

type Connect = (address: { hostname: string; port: number }, options: { secureTransport: 'on' }) => SmtpSocket;

const EMAIL_ADDRESS = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const MAX_REPLY_BYTES = 16_384;

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function encodeSubject(value: string): string {
  return `=?UTF-8?B?${encodeBase64(value)}?=`;
}

function makeMimeMessage(message: SmtpMessage): string {
  const encodedBody = encodeBase64(message.text).match(/.{1,76}/g)?.join('\r\n') ?? '';
  return [
    `From: ${message.from}`,
    `To: ${message.to}`,
    `Subject: ${encodeSubject(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody,
  ].join('\r\n');
}

async function readSmtpReply(reader: ReadableStreamDefaultReader<Uint8Array>, state: { buffer: string }): Promise<{ code: number }> {
  const lines: string[] = [];
  while (true) {
    let end = state.buffer.indexOf('\r\n');
    while (end === -1) {
      if (state.buffer.length > MAX_REPLY_BYTES) throw new Error('SMTP reply too large.');
      const chunk = await reader.read();
      if (chunk.done) throw new Error('SMTP connection closed before a complete reply.');
      state.buffer += new TextDecoder().decode(chunk.value, { stream: true });
      end = state.buffer.indexOf('\r\n');
    }
    const line = state.buffer.slice(0, end);
    state.buffer = state.buffer.slice(end + 2);
    lines.push(line);

    const match = /^(\d{3})([ -])/.exec(line);
    if (!match) throw new Error('Invalid SMTP reply.');
    if (lines.length === 1 && match[2] === ' ') return { code: Number(match[1]) };
    if (lines.length > 1 && Number(match[1]) !== Number(lines[0]?.slice(0, 3))) {
      throw new Error('Inconsistent SMTP reply.');
    }
    if (match[2] === ' ') return { code: Number(match[1]) };
  }
}

export async function sendSmtpEmail(connect: Connect, config: SmtpConfig, message: SmtpMessage): Promise<void> {
  if (!EMAIL_ADDRESS.test(config.username) || !EMAIL_ADDRESS.test(message.from) || !EMAIL_ADDRESS.test(message.to)) {
    throw new Error('SMTP email address is invalid.');
  }
  if (config.username.toLowerCase() !== message.from.toLowerCase()) {
    throw new Error('SMTP sender must match the authenticated mailbox.');
  }
  if (!config.password) throw new Error('SMTP password is missing.');

  const socket = connect({ hostname: config.host, port: 465 }, { secureTransport: 'on' });
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const state = { buffer: '' };
  const write = (value: string) => writer.write(new TextEncoder().encode(value));
  const expect = async (expected: number | number[]) => {
    const reply = await readSmtpReply(reader, state);
    const accepted = Array.isArray(expected) ? expected : [expected];
    if (!accepted.includes(reply.code)) throw new Error(`SMTP expected ${accepted.join('/')}, received ${reply.code}.`);
  };
  const command = async (value: string, expected: number | number[]) => {
    await write(`${value}\r\n`);
    await expect(expected);
  };

  try {
    await socket.opened;
    await expect(220);
    await command('EHLO liyuk.com', 250);
    await command('AUTH LOGIN', 334);
    await command(encodeBase64(config.username), 334);
    await command(encodeBase64(config.password), 235);
    await command(`MAIL FROM:<${message.from}>`, 250);
    await command(`RCPT TO:<${message.to}>`, [250, 251]);
    await command('DATA', 354);
    await write(`${makeMimeMessage(message).replace(/\n\./g, '\n..')}\r\n.\r\n`);
    await expect(250);
    await command('QUIT', 221);
  } finally {
    reader.releaseLock();
    writer.releaseLock();
    await socket.close();
  }
}
