import { connect } from 'cloudflare:sockets';
import { createNotifier } from './notifier.ts';
import { sendSmtpEmail } from './smtp.ts';

export default createNotifier((config, message) => sendSmtpEmail(connect, config, message));
