from datetime import datetime
def convert_date_format(date_str):
    return datetime.strptime(date_str, '%d/%m/%Y').strftime("%Y-%m-%d")
