from pymongo import MongoClient

def mongoSetup():
    '''Initializes a localhost mongoDB, and returns the MongoClient object'''
    db_url = 'mongodb://localhost:27017'
    return(MongoClient(db_url))

client = mongoSetup()
bgg_db = client.boardgames

for game in bgg_db.games.find({'user_rating': {'$exists': True}}): 
    game['user_rating'] = float(game['user_rating'])
    bgg_db.games.save(game)