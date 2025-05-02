from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
from supabase import create_client, Client
import ssl
import requests
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")
supabase_client: Client = create_client(supabase_url, supabase_key)

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_SECRET")
GOOGLE_REDIRECT_URI = "https://localhost:4000/oauth/google"
GOOGLE_REDIRECT_URI_CODE = "https://localhost:4000/oauth/google/code"

app = Flask(__name__)

print(f"GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID}")
print(f"GOOGLE_CLIENT_SECRET: {GOOGLE_CLIENT_SECRET}")
print(f"GOOGLE_REDIRECT_URI: {GOOGLE_REDIRECT_URI}")
print(f"GOOGLE_REDIRECT_URI_CODE: {GOOGLE_REDIRECT_URI_CODE}")


def exchange_code_for_google_token(code: str) -> dict:
    """
    Exchange OAuth code for Google access token.

    Args:
        code (str): The authorization code received from Google

    Returns:
        dict: Token response containing access_token, refresh_token, etc.
    """
    try:
        # Create flow instance using the client secrets file
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI]
                }
            },
            scopes=["https://www.googleapis.com/auth/userinfo.profile",
                    "https://www.googleapis.com/auth/userinfo.email"]
        )

        # Exchange the code for tokens
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        token_response = flow.fetch_token(code=code)

        return token_response
    except Exception as e:
        print(f"Error exchanging code for token: {str(e)}")
        raise


@app.route('/oauth/google', methods=['GET'])
def handle_google_oauth_tokens():
    """
    Handle Google OAuth callback.
    This route receives the OAuth response from Google and processes it.
    """
    print("Received request arguments:", dict(request.args))


@app.route('/', methods=['GET'])
def handle_google_oauth_code():
    """
    Handle Google OAuth callback.
    This route receives the OAuth grant code response from Google and processes it.
    """
    # Log all request arguments
    print("Received request arguments:", dict(request.args))

    try:
        # Get the code from the query parameters
        code = request.args.get('code')
        print(f"Received code: {code}")

        if not code:
            print("No code provided in request")
            return jsonify({'error': 'No code provided'}), 400

        exchange_code_for_google_token(code)

    except Exception as e:
        print(f"Error in OAuth callback: {str(e)}")
        return jsonify({'error': str(e)}), 500


def set_supabase_session(code: str):
    """
    Set the Supabase session in the Flask session.
    """

    # Exchange the code for Supabase session
    print("Exchanging code for Supabase session...")
    supabase_response = supabase_client.auth.exchange_code_for_session(
        code)
    print("Supabase response received")

    # Log session and user data
    if supabase_response.session:
        print("Session data:", supabase_response.session.model_dump_json())
    if supabase_response.user:
        print("User data:", supabase_response.user.model_dump_json())

    # Return the session data
    return jsonify({
        'message': 'OAuth successful',
        'supabase_session': supabase_response.session.model_dump_json() if supabase_response.session else None,
        'supabase_user': supabase_response.user.model_dump_json() if supabase_response.user else None
    }), 200

# @app.route('/', methods=['GET'])


def root():
    """
    Root route that displays query parameters in HTML format.
    """
    query_params = request.args
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Query Parameters</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .param-container {
                background-color: #f5f5f5;
                padding: 20px;
                border-radius: 5px;
                margin-top: 20px;
            }
            .param-item {
                margin: 10px 0;
                padding: 10px;
                background-color: white;
                border-radius: 3px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .param-key {
                font-weight: bold;
                color: #333;
            }
            .param-value {
                color: #666;
                margin-left: 10px;
            }
            h1 {
                color: #333;
            }
        </style>
    </head>
    <body>
        <h1>Query Parameters</h1>
        <div class="param-container">
    """

    if query_params:
        for key, value in query_params.items():
            html += f"""
            <div class="param-item">
                <span class="param-key">{key}:</span>
                <span class="param-value">{value}</span>
            </div>
            """
    else:
        html += "<p>No query parameters provided</p>"

    html += """
        </div>
    </body>
    </html>
    """

    return html


def generate_self_signed_cert():
    """
    Generate self-signed SSL certificates if they don't exist.
    """
    cert_path = 'cert.pem'
    key_path = 'key.pem'

    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        print("Generating self-signed SSL certificates...")
        os.system(
            f'openssl req -x509 -newkey rsa:4096 -nodes -out {cert_path} -keyout {key_path} -days 365 -subj "/CN=localhost"')
        print("Certificates generated successfully!")


if __name__ == '__main__':
    # Generate SSL certificates
    generate_self_signed_cert()

    # Create SSL context
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('cert.pem', 'key.pem')

    # Run the app with HTTPS
    app.run(
        host='0.0.0.0',
        port=4000,
        ssl_context=context,
        debug=True
    )
