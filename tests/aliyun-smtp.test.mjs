import assert from 'node:assert/strict';
import test from 'node:test';
import { sendSmtpEmail } from '../workers/email-notifier/src/smtp.ts';

test('sends a UTF-8 notification through Aliyun SMTP over implicit TLS', async () => {
  const replies = [
    '220 Aliyun SMTP ready\r\n',
    '250-smtp.aliyun.com\r\n250 AUTH LOGIN\r\n',
    '334 VXNlcm5hbWU6\r\n',
    '334 UGFzc3dvcmQ6\r\n',
    '235 Authentication successful\r\n',
    '250 Sender accepted\r\n',
    '250 Recipient accepted\r\n',
    '354 End data with <CR><LF>.<CR><LF>\r\n',
    '250 Message queued\r\n',
    '221 Bye\r\n',
  ];
  const writes = [];
  let connection;
  const connect = (address, options) => {
    connection = { address, options };
    return {
      opened: Promise.resolve(),
      readable: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(replies.join('')));
          controller.close();
        },
      }),
      writable: new WritableStream({
        write(chunk) { writes.push(new TextDecoder().decode(chunk)); },
      }),
      close: async () => {},
    };
  };

  await sendSmtpEmail(connect, {
    host: 'smtp.qiye.aliyun.com',
    username: 'hello@liyuk.com',
    password: 'client-secret',
  }, {
    from: 'hello@liyuk.com',
    to: 'likun.liyuk@gmail.com',
    subject: '【新点赞】一篇文章',
    text: '有人赞了文章。\n文章：https://liyuk.com/writing/example/',
  });

  assert.deepEqual(connection, {
    address: { hostname: 'smtp.qiye.aliyun.com', port: 465 },
    options: { secureTransport: 'on' },
  });
  assert.deepEqual(writes.slice(0, 5), [
    'EHLO liyuk.com\r\n',
    'AUTH LOGIN\r\n',
    'aGVsbG9AbGl5dWsuY29t\r\n',
    'Y2xpZW50LXNlY3JldA==\r\n',
    'MAIL FROM:<hello@liyuk.com>\r\n',
  ]);
  assert.ok(writes.includes('RCPT TO:<likun.liyuk@gmail.com>\r\n'));
  const data = writes.find((write) => write.startsWith('From: hello@liyuk.com\r\n'));
  assert.ok(data);
  assert.match(data, /To: likun\.liyuk@gmail\.com/);
  assert.match(data, /Subject: =\?UTF-8\?B\?/);
  assert.match(data, /Content-Transfer-Encoding: base64/);
  assert.ok(writes.includes('QUIT\r\n'));
});

test('rejects SMTP protocol failures without exposing credentials', async () => {
  const connect = () => ({
    opened: Promise.resolve(),
    readable: new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('421 temporarily unavailable\r\n')); controller.close(); },
    }),
    writable: new WritableStream(),
    close: async () => {},
  });
  await assert.rejects(
    sendSmtpEmail(connect, { host: 'smtp.qiye.aliyun.com', username: 'hello@liyuk.com', password: 'secret' }, {
      from: 'hello@liyuk.com', to: 'likun.liyuk@gmail.com', subject: 'Test', text: 'Body',
    }),
    /SMTP expected 220, received 421/,
  );
});
