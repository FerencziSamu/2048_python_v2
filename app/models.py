from app import db
from sqlalchemy.schema import Column
from sqlalchemy.types import (String, TypeDecorator, DateTime)
import json


class ArrayType(TypeDecorator):
    impl = String

    def process_bind_param(self, value, dialect):
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        return json.loads(value)

    def copy(self):
        return ArrayType(self.impl.length)


class Game_obj(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    team_name = db.Column(db.String(50))
    uId = db.Column(db.String(30))
    board = Column(ArrayType())
    c_score = db.Column(db.Integer)
    expires_at = Column(DateTime)
    interval_id = db.Column(db.Integer, db.ForeignKey('interval.id'))


class Interval(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    start_time = db.Column(DateTime)
    end_time = db.Column(DateTime, nullable=True)
    active = db.Column(db.Boolean, nullable=False, default=False)
    valid = db.Column(db.Boolean, nullable=False, default=True)
    games = db.relationship('Game_obj')
