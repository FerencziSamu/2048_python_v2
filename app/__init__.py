from datetime import datetime
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

from app import database_2048


def delete_from_db():
    now = datetime.now()
    database_2048.delete_from_db(now)


app = Flask(__name__)
app.config['SECRET_KEY'] = 'so amazingly secret'  # for session values
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
db = SQLAlchemy(app)
scheduler = BackgroundScheduler({'apscheduler.timezone': 'Europe/Budapest', 'daemon': True})
scheduler.add_jobstore('sqlalchemy', url='sqlite:////tmp/schedule.db')
scheduler.remove_all_jobs()
job = scheduler.add_job(delete_from_db, trigger='interval', hours=24)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

import alone_2048
