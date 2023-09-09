from datetime import datetime, timedelta
from pytz import timezone
def convert_date_format(date_str):
    return datetime.strptime(date_str, '%d/%m/%Y').strftime("%Y-%m-%d")

def convert_deadline(date_str, hours):
    # Parse the date string to a datetime object
    date = datetime.strptime(date_str, "%d/%m/%Y")
    paris_tz = timezone("Europe/Paris")
    start_date_obj = date.replace(hour = 8, minute = 0)
    start_date_obj = paris_tz.localize(start_date_obj)
    # Format the datetime object to the ISO format with the appropriate timezone
    start_date_str = start_date_obj.isoformat()

    end_date_obj = start_date_obj + timedelta(hours = hours)
    end_date_str = end_date_obj.isoformat()

    return start_date_str, end_date_str