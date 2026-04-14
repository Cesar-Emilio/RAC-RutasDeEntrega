import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.core.mail.backends.base import BaseEmailBackend


class GmailBackend(BaseEmailBackend):
    """
    Backend de correo usando Gmail SMTP con contraseña de aplicación
    """

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently)
        self.host = 'smtp.gmail.com'
        self.port = 587
        self.username = os.getenv('GOOGLE_EMAIL_USER')
        self.password = os.getenv('GOOGLE_EMAIL_APP_PASSWORD')
        self.use_tls = True

    def send_messages(self, email_messages):
        """
        Envía mensajes de correo usando Gmail SMTP
        """
        if not self.username or not self.password:
            if not self.fail_silently:
                raise ValueError("GOOGLE_EMAIL_USER y GOOGLE_EMAIL_APP_PASSWORD deben estar configurados")
            return 0

        msg_count = 0

        try:
            # Conectar al servidor SMTP
            server = smtplib.SMTP(self.host, self.port)
            server.starttls()
            server.login(self.username, self.password)

            for message in email_messages:
                try:
                    # Crear mensaje MIME
                    msg = self._build_mime_message(message)

                    # Enviar mensaje
                    server.sendmail(message.from_email, message.to, msg.as_string())
                    msg_count += 1

                except Exception as e:
                    if not self.fail_silently:
                        raise e

            server.quit()

        except Exception as e:
            if not self.fail_silently:
                raise e

        return msg_count

    def _build_mime_message(self, message):
        """
        Construye un mensaje MIME desde un mensaje de Django
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = message.subject
        msg['From'] = message.from_email
        msg['To'] = ', '.join(message.to)

        if message.cc:
            msg['Cc'] = ', '.join(message.cc)

        if message.bcc:
            msg['Bcc'] = ', '.join(message.bcc)

        # Agrega el contenido
        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)

        msg_text = MIMEText(message.body, 'plain')
        msg_alternative.attach(msg_text)

        # Si hay contenido HTML
        if message.alternatives:
            for content, mimetype in message.alternatives:
                if mimetype == 'text/html':
                    msg_html = MIMEText(content, 'html')
                    msg_alternative.attach(msg_html)

        return msg
