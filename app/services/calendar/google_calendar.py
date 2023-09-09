from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import logging
import os 
from decouple import config

SCOPES = ["https://www.googleapis.com/auth/calendar"]
PATH_TO_CREDENTIALS = config("GOOGLE_CREDENTIALS_CALENDAR_PATH")
creds = None

# The file token.json stores the user's access and refresh tokens, and is
# created automatically when the authorization flow completes for the first
# time.
if os.path.exists("token.json"):
    creds = Credentials.from_authorized_user_file('token.json')

# If there are no (valid) credentials available, let the user log in.
if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(
            PATH_TO_CREDENTIALS, 
            SCOPES
        )
        logging.info(f'FLOW {dir(flow)}')
        creds = flow.run_local_server(port = 8080)
    # Save the credentials for the next run
    with open('token.json', "w") as token:
        token.write(creds.to_json())
    
service = build('calendar', 'v3', credentials = creds)

def create_event(event_details):
    # Call the Calendar API
    event = service.events().insert(calendarId = 'primary', 
                                    body = event_details).execute()
    return f'Event Created: {event["htmlLink"]}'