import untangle
import html
import time
from pymongo import MongoClient, InsertOne, DeleteMany

def mongoSetup():
    '''Initializes a localhost mongoDB, and returns the MongoClient object'''
    db_url = 'mongodb://localhost:27017'
    return(MongoClient(db_url))


def game_retrieval(idMin, idMax):
    #to build request url
    url_ids = ','.join(map(str, list(range(idMin,idMax))))

    #api request call
    obj = untangle.parse(f'https://www.boardgamegeek.com/xmlapi2/thing?id={url_ids}&stats=1&type=boardgame')

    result_list_of_dicts = []
    for item in obj.items.item:
        if (item.yearpublished['value'] == "0" or item.maxplayers['value'] == "0"
        or item.yearpublished['value'] == ""):
            print("Skipped due to year or playercount")
        else:
            print(item['id'])
            try:
                thumbnail = item.image.cdata
            except Exception:
                thumbnail = ""
                pass
            #parse out the primary game name
            for name in item.name:
                if name['type'] == 'primary':
                    gameName = name['value']

            #parse the listed categories
            #and mechanics
            categories = []
            mechanics = []
            for link in item.link:
                if link['type'] == 'boardgamecategory':
                    categories.append(link['value'])
                elif link['type'] == 'boardgamemechanic':
                    mechanics.append(link['value'])

            # parse out the poll data from the XML
            for poll in item.poll:
                if poll['name'] == 'suggested_numplayers':
                    if poll['totalvotes'] == '0':
                        suggest_playerct = "NO DATA"
                    else:
                        suggest_playerct = {}
                        for result in poll.results:
                            #number of players for this vote
                            playct = result['numplayers']
                            votes = []
                            #this syntax is getting weird b/c of the field names
                            #grab the best/rec/notrect counts as a list of tuples
                            for row in result.result:
                                votes.append((row['value'], int(row['numvotes'])))
                            #push the tuples to a dict
                            votedict = {}
                            votedict.update(votes)
                            #for each player count, push the vote dict
                            suggest_playerct.update({playct : votedict})
                elif poll['name'] == 'suggested_playerage':
                    if poll['totalvotes'] == '0':
                        suggest_playerage = "NO DATA"
                    else:
                        suggest_playerage = {}
                        votes = []
                        for row in poll.results.result:
                            votes.append((row['value'], int(row['numvotes'])))
                        suggest_playerage.update(votes)
                elif poll['name'] == 'language_dependence':
                    if poll['totalvotes'] == '0':
                        lang_dep = "NO DATA"
                    else:
                        lang_dep = {}
                        votes = []
                        for row in poll.results.result:
                            votes.append((row['value'].split(" ")[0], int(row['numvotes'])))
                        lang_dep.update(votes)
                else:
                    print("unknown poll name")
                            
            #parse out the user rating
            user_rating = item.statistics.ratings.average['value']
            game_dict = {
                'id' : item['id'],
                'thumbnail' : thumbnail,
                'gameName' : gameName,
                'description' : html.unescape(item.description.cdata),
                'yearPublished' : int(item.yearpublished['value']),
                'minPlayers' : int(item.minplayers['value']),
                'maxPlayers' : int(item.maxplayers['value']),
                'minTime' : int(item.minplaytime['value']),
                'maxTime' : int(item.maxplaytime['value']),
                'minAge' : int(item.minage['value']),
                'categories' : categories,
                'mechanics' : mechanics,
                'suggested_player_ct' : suggest_playerct,
                'suggested_player_age' : suggest_playerage,
                'language_dependency' : lang_dep,
                'user_rating' : int(user_rating)
            }
            result_list_of_dicts.append(game_dict)
    
    return(result_list_of_dicts)

def main():
    #initialize the mongo client and database
    client = mongoSetup()
    bgg_db = client.boardgames

    #as of 2-6-2020
    last_bgg_item = 301034
    #build our id range chunks
    id_ranges = [x*1000 for x in list(range(0,301))]
    id_ranges.append(last_bgg_item+1)
    for x in range(0,len(id_ranges)-1):
        game_list = game_retrieval(id_ranges[x],id_ranges[x+1])
        # print(game_list)
        # inserts = [InsertOne(game) for game in game_list]
        bgg_db.games.insert_many(game_list)
        time.sleep(5)

main()