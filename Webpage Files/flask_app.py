from flask import Flask, jsonify, render_template
from pymongo import MongoClient

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
        if (kv_pair[0] == 'playerAge'):
            filter_dict.update({'minAge': {'$lte':int(kv_pair[1])}})
            proper_query = True

        if (kv_pair[0] == 'rating'):
            filter_dict.update({'user_rating': {'$gte':float(kv_pair[1])}})
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
    mongo_url = 'mongodb+srv://mongoAdmin:BGG1198$@cluster0-qg8p8.mongodb.net/test?retryWrites=true&w=majority'
    client = MongoClient(mongo_url)
    db = client.boardgames
    games = [game for game in db.games.find(filter=filter_dict, projection={'_id': False})]

    response = jsonify(games)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

app = Flask(__name__, static_url_path='')

@app.route('/')
def home():
    """
    This renders the home page/base route
    """
    return render_template('index.html')


@app.route('/data')
def data(query_param = ''):
    """
    This function calls the db_query function, and returns all data when a
    user goes to the /data 
    """
    games = db_query()    
    return games

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