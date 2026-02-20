import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from database.models import Base

_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(_data_dir, exist_ok=True)

DB_PATH = os.path.join(_data_dir, "alpha_terminal.db")
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
Session = scoped_session(sessionmaker(bind=engine))


def init_db():
    Base.metadata.create_all(engine)


def get_session():
    return Session()
