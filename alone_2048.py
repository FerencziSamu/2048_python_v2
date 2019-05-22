import time
from app import app, db, database_2048
from app.models import Game_obj, Interval
from game import *
from flask import request, render_template, jsonify, send_file
from datetime import datetime, timedelta


@app.route("/")
def main():
    return render_template('index.html')


@app.route('/api/play_the_game', methods=['POST', 'GET'])
def play_the_game():
    resp = request.get_json()
    uId = str(resp['uId'])
    direction = resp['direction']
    z = Game_obj.query.filter_by(uId=uId).first()
    b = Game(board=z.board, c_score=z.c_score)
    board = b.x
    moved = b.process_move(direction)
    legit = b.next_step_check()
    c_score = b.c_score
    if legit:
        if moved and b.count_zeroes() != 0:
            b.add_number()
            Game_obj.query.filter_by(uId=uId).update(dict(board=board))
            Game_obj.query.filter_by(uId=uId).update({"c_score": c_score})
            game_data = {"board": board, "c_score": c_score, "uId": uId, "game_over": False}
            game_dict = jsonify(game_data)
            db.session.commit()
            return game_dict
        elif moved:
            Game_obj.query.filter_by(uId=uId).update(dict(board=board))
            Game_obj.query.filter_by(uId=uId).update({"c_score": c_score})
            game_data = {"board": board, "c_score": c_score, "uId": uId, "game_over": False}
            game_dict = jsonify(game_data)
            db.session.commit()
            return game_dict
        else:
            Game_obj.query.filter_by(uId=uId).update(dict(board=board))
            Game_obj.query.filter_by(uId=uId).update({"c_score": c_score})
            game_data = {"board": board, "c_score": c_score, "uId": uId, "game_over": False}
            game_dict = jsonify(game_data)
            db.session.commit()
            return game_dict
    game_data = {"board": board, "c_score": c_score, "uId": uId, "game_over": True}
    game_dict = jsonify(game_data)
    return game_dict


@app.route('/api/high_scores/current')
def current_score():
    interval = Interval.query.filter_by(active=True).first()
    if interval is None:
        return "There is no active internal"
    result = Game_obj.query.filter_by(interval_id=interval.id).order_by(Game_obj.c_score.desc()).limit(10).all()
    ob = [[res.team_name, res.c_score] for res in result]
    return jsonify(ob)


# @app.route('/api/high_scores')
# def all_score():
#     interval = Interval.query.all()
#     if interval is None:
#         return "There is no internal"
#     obj = [[res.team_name, res.c_score] for res in result]
#     result = Game_obj.query.filter_by(interval_id=interval.id).order_by(Game_obj.c_score.desc()).limit(10).all()
#     ob = [[res.team_name, res.c_score] for res in result]
#     return jsonify(ob)


@app.route('/api/new_game', methods=['POST'])
def new_game():
    resp = request.get_json()
    team_name = resp['team_name']
    interval = Interval.query.filter_by(active=True).first()
    now = datetime.now()
    expires_at = now + timedelta(hours=3)
    b = Game(board=None, c_score=0)
    uId = str(time.time())
    b.add_number()
    board = b.x
    c_score = b.c_score
    if interval is None:
        game_obj = Game_obj(team_name=team_name, uId=uId, c_score=c_score, board=board, expires_at=expires_at,
                            interval_id=None)
        db.session.add(game_obj)
        db.session.commit()
        game_data = {"board": board, "c_score": c_score, "uId": uId}
        game_dict = jsonify(game_data)
        return game_dict
    game_obj = Game_obj(team_name=team_name, uId=uId, c_score=c_score, board=board, expires_at=expires_at,
                        interval_id=interval.id)
    game_data = {"board": board, "c_score": c_score, "uId": uId}
    game_dict = jsonify(game_data)
    db.session.add(game_obj)
    db.session.commit()
    return game_dict


@app.route('/start_interval', methods=['POST'])
def start_interval():
    is_active = Interval.query.filter_by(active=True).first()
    if is_active is not None:
        return "Mar van aktiv interval!"
    resp = request.get_json()
    name = resp['name']
    start = datetime.now()
    interval = Interval(name=name, start_time=start, end_time=None, active=True)
    db.session.add(interval)
    db.session.commit()
    return str(interval.id)


@app.route('/stop_interval')
def stop_interval():
    stop = datetime.now()
    Interval.query.filter_by(active=True).update({"active": False})
    Interval.query.filter_by(active=True).update(dict(end_time=stop))
    db.session.commit()
    return "gg"


# @app.route('/save_user_highscore', methods=['POST', 'GET'])
# def save_user_highscore():
#     resp = request.get_json()
#     u_name = resp['u_name']
#     c_score = resp['c_score']
#     database_2048.save_to_scores_db(u_name, c_score)
#     msg = "Saved!"
#     return msg

def download(path):
    return send_file(path, as_attachment=True)


@app.route('/download_scores')
def download_scores():
    return download('../scores.db')


@app.route('/download_db')
def download_db():
    return download('database.db')
