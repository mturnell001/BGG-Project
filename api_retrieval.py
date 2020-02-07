import untangle
import os
from datetime import datetime, timedelta
from pymongo import MongoClient

def mongoSetup():
    '''Initializes a localhost mongoDB, and returns the MongoClient object'''
    db_url = 'mongodb://localhost:27017'
    return(MongoClient(db_url))


def game_retrieval():
    #as of 2-6-2020
    last_bgg_item = 301034
    #to build request url
    url_ids = ','.join(map(str, list(range(1,75))))

    #api request call
    obj = untangle.parse(f'https://www.boardgamegeek.com/xmlapi2/thing?id={url_ids}')

    result_list_of_dicts = []

    for item in obj.items.item:
        if (item['type'] != "boardgame"):
            print("Skipped (not a boardgame)")
            print(item['id'])
        elif (item.yearpublished['value'] == "0"):
            print("Skipped due to year")
        else:
            print(item['id'])
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

            game_dict = {
                'id' : item['id'],
                'thumbnail' : item.image.cdata,
                'gameName' : gameName,
                'description' : item.description.cdata,
                'yearPublished' : item.yearpublished['value'],
                'minPlayers' : item.minplayers['value'],
                'maxPlayers' : item.maxplayers['value'],
                'minTime' : item.minplaytime['value'],
                'maxTime' : item.maxplaytime['value'],
                'minAge' : item.minage['value'],
                'categories' : categories,
                'mechanics' : mechanics
            }
        result_list_of_dicts.append(game_dict)
    
    return(result_list_of_dicts)
        # print the game categories for the given item
        # for link in item.link:
        #     if (link['type'] == 'boardgamecategory'):
                # print(link['value'])
        
        #print the player counts
        # print(item.minplayers['value'])
        # print(item.maxplayers['value]'])

def main():
    #initialize the mongo client and database
    client = mongoSetup()
    bgg_db = client.boardgames

    game_list = game_retrieval()
    bgg_db.games_test.insert_many(game_list)

main()