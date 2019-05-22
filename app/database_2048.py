import sqlite3


def create_db():
    conn = sqlite3.connect('scores.db')
    c = conn.cursor()
    c.execute("CREATE TABLE high_scores (u_name text, score integer)")
    conn.commit()
    conn.close()


def save_to_scores_db(u_name, c_score):
    conn = sqlite3.connect('scores.db')
    c = conn.cursor()
    c.execute("INSERT INTO high_scores VALUES(?, ?)", (u_name, c_score))
    conn.commit()
    conn.close()


def get_high_scores_from_db():
    conn = sqlite3.connect('scores.db')
    c = conn.cursor()
    c.execute("SELECT * FROM high_scores ORDER BY SCORE DESC")
    score_list = c.fetchmany(5)
    conn.commit()
    conn.close()
    return score_list


def delete_from_db(time):
    conn = sqlite3.connect('app/database.db')
    c = conn.cursor()
    c.execute("DELETE FROM game_obj WHERE expires_at<?", (time, ))
    conn.commit()
    conn.close()


# def get_high_scores(time_1, time_2):
#     conn = sqlite3.connect('app/database.db')
#     c = conn.cursor()
#     c.execute("SELECT team_name,c_score FROM game_obj WHERE expires_at<? AND expires_at>?", (time_1, time_2))
#     conn.commit()
#     conn.close()
