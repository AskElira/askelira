import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailSender:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL')
        self.sender_password = os.getenv('SENDER_PASSWORD')
        
        if not self.sender_email or not self.sender_password:
            raise ValueError("SENDER_EMAIL and SENDER_PASSWORD must be set in environment variables")
    
    def send_email(self, recipient, subject, body):
        msg = MIMEMultipart('alternative')
        msg['From'] = self.sender_email
        msg['To'] = recipient
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            return {"success": True, "message": f"Email sent successfully to {recipient}"}
        except smtplib.SMTPAuthenticationError:
            return {"success": False, "message": "Authentication failed. Check email and password."}
        except smtplib.SMTPException as e:
            return {"success": False, "message": f"SMTP error occurred: {str(e)}"}
        except Exception as e:
            return {"success": False, "message": f"Failed to send email: {str(e)}"}

def main():
    sender = EmailSender()
    
    result = sender.send_email(
        recipient="alvin.kerremans@gmail.com",
        subject="Test Email from AskElira Build System",
        body="Hello,\n\nThis is a test email from the AskElira email sender script.\n\nIf you receive this, the email system is working correctly!\n\nBest regards,\nAskElira Team"
    )
    
    if result["success"]:
        print(f"✓ {result['message']}")
        return 0
    else:
        print(f"✗ {result['message']}")
        return 1

if __name__ == "__main__":
    exit(main())

# Create .env file with:
# SENDER_EMAIL=your-email@gmail.com
# SENDER_PASSWORD=your-app-password
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587