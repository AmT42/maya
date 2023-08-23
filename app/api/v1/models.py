from fastapi_users import models
import datetime
from typing import TypeVar

IDType = TypeVar("IDType")

class UserDB(models.UserProtocol[IDType]):
    created_at: datetime.datetime

