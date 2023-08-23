from decouple import config

from db.models import User

from fastapi import FastAPI, Depends
from fastapi_users import FastAPIUsers, models
from fastapi_users.router import get_auth_router, get_register_router, get_users_router,get_reset_password_router, get_verify_router
from fastapi_users.authentication import JWTStrategy
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

from db.models import User
from api.v1.models import UserDB
from db.session import engine
from core.config import settings
app = FastAPI()

DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = config("SECRET_KEY")

user_db = SQLAlchemyUserDatabase(UserDB, engine, User.__table__)
auth_backends = []

jwt_strategy = JWTStrategy(secret=SECRET_KEY, lifetime_seconds=3600)
auth_backends.append(jwt_strategy)


def after_forgot_password(user: UserDB, token: str):
    # Send an email to user.email with the token
    pass

def after_reset_password(user: UserDB):
    # Notify the user that their password has been reset
    pass

def after_verification_request_function(user: UserDB):
    # Notify the user that their password has been reset
    pass

fastapi_users = FastAPIUsers(
    user_db,
    auth_backends,
)

auth_router = get_auth_router(auth_backends[0])
register_router = get_register_router(fastapi_users)
users_router = get_users_router(fastapi_users)
reset_password_router = get_reset_password_router(
    fastapi_users,
    reset_token_secret=config("SECRET_KEY"),
    after_forgot_password=after_forgot_password,
    after_reset_password=after_reset_password,
)
verify_router = get_verify_router(
    fastapi_users,
    verification_token_secret=config("SECRET_KEY"),
    after_verification_request=after_verification_request_function,
)

app.include_router(auth_router, prefix="/auth/jwt", tags=["auth"])
app.include_router(register_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(reset_password_router, prefix="/auth", tags=["auth"])
app.include_router(verify_router, prefix="/auth", tags=["auth"])



# @app.post("/upload")
# def upload_document(db: Session = Depends(get_db)):
#     pass

# @app.post("/validate")
# def validate_information(db: Session = Depends(get_db)):
#     pass 

# @app.get("/info")
# def get_info(db: Session = Depends(get_db)):
#     pass


# @app.get("/")
# def read_root():
#     return {"Hello":"Word"}