from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from utils.date_fmt import convert_deadline
import logging
import os 
import datetime
from decouple import config




SCOPES = ["https://www.googleapis.com/auth/calendar"]
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SA_CREDENTIALS')

def init_google_calendar_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)

    service = build('calendar', 'v3', credentials=creds)
    return service

def create_event(validated_info):
    service = init_google_calendar_service()
    
    start_date, end_date = convert_deadline(validated_info["google_calendar"], hours = 2)

    # Call the Calendar API
    event_details = {
        "summary": f'event {validated_info["doctype"]} from {validated_info["expediteur"]}',
        "description": f"{validated_info['recapitulatif']}",
        "start": {
            "dateTime": start_date,
            "timeZone": "Europe/Paris",
        },
        "end": {
            "dateTime": end_date,
            "timeZone": "Europe/Paris",
        },
    }

    event = service.events().insert(calendarId='krimino938@gmail.com', body=event_details).execute()
    return f'Event Created: {event["htmlLink"]}'

# SCOPES = ["https://www.googleapis.com/auth/calendar"]
# PATH_TO_CREDENTIALS = config("GOOGLE_CREDENTIALS_CALENDAR_PATH")
# creds = None

# # The file token.json stores the user's access and refresh tokens, and is
# # created automatically when the authorization flow completes for the first
# # time.
# if os.path.exists("token.json"):
#     creds = Credentials.from_authorized_user_file('token.json')

# # If there are no (valid) credentials available, let the user log in.
# if not creds or not creds.valid:
#     if creds and creds.expired and creds.refresh_token:
#         creds.refresh(Request())
#     else:
#         flow = InstalledAppFlow.from_client_secrets_file(
#             PATH_TO_CREDENTIALS, 
#             SCOPES
#         )
#         logging.info(f'FLOW {dir(flow)}')
#         creds = flow.run_local_server(port = 8080)
#     # Save the credentials for the next run
#     with open('token.json', "w") as token:
#         token.write(creds.to_json())
    
# service = build('calendar', 'v3', credentials = creds)

# def create_event(validated_info):
#     start_date, end_date = convert_deadline(validated_info["google_calendar"])

#     # Call the Calendar API
#     event_details = {
#         "summary": f'event {validated_info["doctype"]} from {validated_info["expediteur"]}',
#         "description": f"{validated_info['recapitulatif']}",
#         "start": {
#             "dateTime": start_date,
#             "timeZone": "America/Los_Angeles",
#         },
#         "end": {
#             "dateTime": end_date,
#             "timeZone": "America/Los_Angeles",
#         },
#     }

#     event = service.events().insert(calendarId = 'primary', 
#                                     body = event_details).execute()
#     return f'Event Created: {event["htmlLink"]}'