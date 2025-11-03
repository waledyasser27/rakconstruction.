"""
Rafic A. Kreidie Engineers & Contractors
Flask API for Contact Form
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Email configuration from environment variables
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
RECIPIENT_EMAIL = os.getenv('RECIPIENT_EMAIL', 'info@rak.com.sa')

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'Rafic A. Kreidie Engineers & Contractors API',
        'version': '1.0.0',
        'endpoints': {
            '/api/contact': 'POST - Send contact form',
            '/api/career': 'POST - Submit career form with CV attachment'
        }
    })

@app.route('/api/contact', methods=['POST'])
def contact():
    """Handle contact form submissions"""
    
    try:
        # Get form data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['company_name', 'services', 'contact_name', 'email', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'status': 'error',
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Extract data
        company_name = data.get('company_name')
        services = data.get('services')
        contact_name = data.get('contact_name')
        email = data.get('email')
        message = data.get('message')
        
        # Create email
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USERNAME
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f'New Contact Request from {company_name}'
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #0D0D0D 0%, #2E2E2E 100%);
                    color: #D4AF37;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .content {{
                    background: #ffffff;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                }}
                .field {{
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }}
                .field-label {{
                    font-weight: bold;
                    color: #D4AF37;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                }}
                .field-value {{
                    color: #333;
                    font-size: 16px;
                }}
                .message-box {{
                    background: #f9f9f9;
                    padding: 20px;
                    border-left: 4px solid #D4AF37;
                    border-radius: 5px;
                    margin-top: 20px;
                }}
                .footer {{
                    background: #0D0D0D;
                    color: #D4AF37;
                    padding: 20px;
                    text-align: center;
                    border-radius: 0 0 10px 10px;
                    font-size: 14px;
                }}
                .timestamp {{
                    color: #999;
                    font-size: 12px;
                    text-align: right;
                    margin-top: 10px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏗️ New Contact Request</h1>
                <p>Rafic A. Kreidie Engineers & Contractors</p>
            </div>
            
            <div class="content">
                <div class="field">
                    <div class="field-label">Company Name</div>
                    <div class="field-value">{company_name}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Services Requested</div>
                    <div class="field-value">{services}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Contact Person</div>
                    <div class="field-value">{contact_name}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Email Address</div>
                    <div class="field-value"><a href="mailto:{email}">{email}</a></div>
                </div>
                
                <div class="message-box">
                    <div class="field-label">Message</div>
                    <div class="field-value">{message}</div>
                </div>
                
                <div class="timestamp">
                    Received: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Rafic A. Kreidie Engineers & Contractors</strong></p>
                <p>Building Excellence Since 1985</p>
                <p>Prince Mohammed Bin Abdulaziz Branch Road, Jeddah, Saudi Arabia</p>
                <p><a href="https://rak.com.sa" style="color: #D4AF37;">www.rak.com.sa</a></p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text alternative
        text_body = f"""
        New Contact Request - Rafic A. Kreidie Engineers & Contractors
        
        Company Name: {company_name}
        Services Requested: {services}
        Contact Person: {contact_name}
        Email: {email}
        
        Message:
        {message}
        
        ---
        Received: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        if SMTP_USERNAME and SMTP_PASSWORD:
            try:
                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                
                email_sent = True
            except Exception as e:
                print(f"Error sending email: {str(e)}")
                email_sent = False
        else:
            email_sent = False
            print("SMTP credentials not configured. Email not sent.")
        
        # Return success response
        return jsonify({
            'status': 'success',
            'message': 'Contact form submitted successfully',
            'email_sent': email_sent,
            'data': {
                'company_name': company_name,
                'contact_name': contact_name,
                'email': email,
                'timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"Error processing contact form: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'smtp_configured': bool(SMTP_USERNAME and SMTP_PASSWORD)
    })

@app.route('/api/career', methods=['POST'])
def career():
    """Handle career form submissions with optional CV attachment"""
    try:
        # Expect multipart/form-data
        full_name = request.form.get('full_name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        position = request.form.get('position')
        years_experience = request.form.get('years_experience')
        about = request.form.get('message')

        required_fields = ['full_name', 'email', 'phone', 'position', 'years_experience']
        for field in required_fields:
            if not request.form.get(field):
                return jsonify({'status': 'error', 'error': f'Missing required field: {field}'}), 400

        # Prepare email
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f'New Career Application: {full_name} - {position}'

        # Body
        body_text = f"""
New Career Application - Rafic A. Kreidie Engineers & Contractors

Full Name: {full_name}
Email: {email}
Phone: {phone}
Position: {position}
Years of Experience: {years_experience}

About:
{about or ''}

Received: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        msg.attach(MIMEText(body_text, 'plain'))

        # Attachment (CV)
        if 'cv' in request.files:
            file = request.files['cv']
            if file and file.filename:
                part = MIMEBase('application', 'octet-stream')
                file_bytes = file.read()
                part.set_payload(file_bytes)
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename="{file.filename}"')
                msg.attach(part)

        # Send
        if SMTP_USERNAME and SMTP_PASSWORD:
            try:
                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
                server.quit()
                email_sent = True
            except Exception as e:
                print(f"Error sending career email: {str(e)}")
                email_sent = False
        else:
            print('SMTP credentials not configured. Career email not sent.')
            email_sent = False

        return jsonify({
            'status': 'success',
            'message': 'Career form submitted',
            'email_sent': email_sent
        }), 200

    except Exception as e:
        print(f"Error processing career form: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

# For Vercel serverless function
def handler(request):
    with app.app_context():
        return app.full_dispatch_request()

if __name__ == '__main__':
    app.run(debug=True, port=5000)