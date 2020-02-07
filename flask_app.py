from flask import Flask, jsonify
from pymongo import MongoClient

def db_query():
    mongo_url = 'mongodb://localhost:27017'
    client = MongoClient(mongo_url)
    db = client.boardgames
    games = []
    for game in db.games_test.find({}):
        print(game)
        game.pop('_id')
        games.append(game)
    return games


app = Flask(__name__)

@app.route('/data')
def index():
    games = db_query()    
    return jsonify(games)

if __name__ == '__main__':
    app.run(debug=True)