from pymongo import MongoClient
from config import DB_PASS
remote_db_url = f'mongodb+srv://mongoAdmin:${DB_PASS}@cluster0-qg8p8.mongodb.net/test?retryWrites=true&w=majority'
remote_client = MongoClient(remote_db_url)

local_db_url = 'mongodb://localhost:27017'
local_client = MongoClient(local_db_url)

for game in local_client.boardgames.games.find({}):
    print(game['id'])
    remote_client.boardgames.games.insert(game)