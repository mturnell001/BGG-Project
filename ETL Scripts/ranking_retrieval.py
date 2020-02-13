from pymongo import MongoClient
from config import DB_PASS
import time
import untangle
import math

local_db_url = 'mongodb://localhost:27017'
local_client = MongoClient(local_db_url)

remote_db_url = f'mongodb+srv://mongoAdmin:Is9WzljUe0N8OjPi@cluster0-qg8p8.mongodb.net/test?retryWrites=true&w=majority'
remote_client = MongoClient(remote_db_url)

# change once atlas comes back up
bgg_db = remote_client.boardgames

id_nums = []
for game in bgg_db.games.find({'id': {'$exists': True}}):
        # print(game['id'])
        id_nums.append(game['id'])

# 79447
id_length = len(id_nums)
print(id_length)

id_ranges = [x*1000 for x in list(range(0,math.ceil(id_length / 1000)))]
id_ranges.append(id_length)
print(id_ranges)


results_list = []
for i in range(16, len(id_ranges) - 1):
    url_ids = []
    for j in range(id_ranges[i],id_ranges[i+1]):
        url_ids.append(id_nums[j])

    #to build request url
    url_str = ','.join(map(str, url_ids))
    
    #api request call
    obj = untangle.parse(f'https://www.boardgamegeek.com/xmlapi2/thing?id={url_str}&stats=1&type=boardgame')

    for item in obj.items.item:
        for rank in item.statistics.ratings.ranks.rank:
            if rank['friendlyname'] == "Board Game Rank":
                if rank['value'] == "Not Ranked":
                    results_list.append({'id' : item['id'],
                                        'ranking' : 999999})
                else:
                    results_list.append({'id' : item['id'],
                                        'ranking' : int(rank['value'])})
    
    print(results_list)
    for pair in results_list:
        bgg_db.games.update_one(
            {'id' : pair['id']},
            {'$set': {'ranking' : pair['ranking']}}
        )

    
    print('SLEEP', i)
    time.sleep(1)


# for x in range(0,len(id_ranges)-1):
#     game_list = game_retrieval(id_ranges[x],id_ranges[x+1])
#     bgg_db.games.insert_many(game_list)
#     time.sleep(5)
