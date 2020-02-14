from flask import Flask, jsonify, render_template
from pymongo import MongoClient, ASCENDING
from config import DB_PASS

def db_query(query = '='):
    """
    This function establishes the mongodb database connection, gets
    all the games in the db, removes the mongoDB objectID, and then
    returns it as a JSON object
    """
    filter_dict = {}
    filters = query.split('&')
    proper_query = False
    for item in filters:
        kv_pair = item.split('=')
<<<<<<< HEAD
        if (kv_pair[0] == 'INITIAL_LOAD'):
=======
        if (kv_pair[0] == 'playerAge'):
            filter_dict.update({'minAge': {'$eq':int(kv_pair[1])}})
>>>>>>> 9cd06fd0583ce82f5ff8a2c720064a55b56ebd6f
            proper_query = True
            
        if (kv_pair[0] == 'playerAge'):
            filter_dict.update({'minAge': {'$eq':int(kv_pair[1])}})
            proper_query = True
        
        if (kv_pair[0] == 'numPlayers'):
            filter_dict.update({'minPlayers': {'$lte':int(kv_pair[1])}})
            filter_dict.update({'maxPlayers': {'$gte':int(kv_pair[1])}})
            proper_query = True
        
        if (kv_pair[0] == 'gameTime'):
            filter_dict.update({'minTime': {'$lte':int(kv_pair[1])}})
            filter_dict.update({'maxTime': {'$gte':int(kv_pair[1])}})
            proper_query = True

    if (proper_query == False):
        return {'results':'no results'}
    mongo_url = f'mongodb+srv://mongoAdmin:{DB_PASS}@cluster0-qg8p8.mongodb.net/test?retryWrites=true&w=majority'
    client = MongoClient(mongo_url)
    db = client.boardgames
    games = [game for game in db.games_with_ranking.\
        find(filter=filter_dict, projection={'_id': False}).\
            sort([("ranking", ASCENDING)]).\
                limit(10)]

    response = jsonify(games)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

app = Flask(__name__)

@app.route('/')
def home():
    """
    This renders the home page/base route
    """
    return render_template('index.html')

@app.route('/api/<query_param>')
def api(query_param = ''):
    """
    This function calls the db_query function, and returns all data that
    matches the filter
    """
    games = db_query(query_param)    
    return games

if __name__ == '__main__':
    app.run(debug=True)