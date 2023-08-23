# from fastapi_users.authentication import JWTAuthentication
# from fastapi_users import FastAPIUsers
# from fastapi_users.db import SQLAlchemyUserDatabase
# from .config import SECRET_KEY
# from db.session import SessionLocal  # Adjust the import based on your directory structure
# from db.models import User, UserTable
# from decouple import config 

# jwt_authentication = JWTAuthentication(secret = config("SECRET_KEY"))
# user_db = SQLAlchemyUserDatabase(User, db.session, UserTable.__table__ )

# fastapi_users = FastAPIUsers(
#     user_db, 
#     [jwt_authentication],
#     User,
#     User,
#     User,
#     User,
# )