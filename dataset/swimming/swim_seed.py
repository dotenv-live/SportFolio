import pymongo
from bson import ObjectId
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# 1. Database Connection Setup
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    sys.exit("ERROR: MONGO_URI is not set. Add it to dataset/.env or export it.")
client = pymongo.MongoClient(MONGO_URI)
db = client[os.getenv("DB", "sportfolio3")]

# Clean slate: drop existing collections if running this multiple times
# db.players.drop()
# db.player_matches.drop()

# 2. Prepare Players Data
players_data = [
    {
        "_id": ObjectId("609c71d828d500ebcf9f526a"),
        "name": "Srihari Nataraj",
        "sport": "swimming",
        "career_stats": {
            "100_back_lcm": {
                "label": "100m Backstroke (LCM)",
                "races": 58,
                "personal_best": {
                    "time": "53.77",
                    "time_ms": 53770,
                    "date": "2021-06-27",
                    "meet_name": "Sette Colli Trophy",
                    "fina_points": 880
                },
                "medals": { "gold": 14, "silver": 6, "bronze": 3 }
            },
            "50_back_lcm": {
                "label": "50m Backstroke (LCM)",
                "races": 45,
                "personal_best": {
                    "time": "24.40",
                    "time_ms": 24400,
                    "date": "2021-12-18",
                    "meet_name": "FINA World Championships",
                    "fina_points": 865
                },
                "medals": { "gold": 10, "silver": 5, "bronze": 2 }
            }
        },
        "competitions": ["olympics", "commonwealth_games", "asian_games", "wa_champs"],
        "last_updated": datetime.now(timezone.utc),
        "register_info": {"name": "Srihari Nataraj", "unique_name": "Srihari Nataraj"},
        "total_matches": 103
    },
    {
        "_id": ObjectId("609c71d828d500ebcf9f526b"),
        "name": "Sajan Prakash",
        "sport": "swimming",
        "career_stats": {
            "200_fly_lcm": {
                "label": "200m Butterfly (LCM)",
                "races": 62,
                "personal_best": {
                    "time": "1:56.38",
                    "time_ms": 116380,
                    "date": "2021-06-26",
                    "meet_name": "Sette Colli Trophy",
                    "fina_points": 864
                },
                "medals": { "gold": 22, "silver": 12, "bronze": 5 }
            }
        },
        "competitions": ["olympics", "asian_games", "wa_champs", "nat_games"],
        "last_updated": datetime.now(timezone.utc),
        "register_info": {"name": "Sajan Prakash", "unique_name": "Sajan Prakash"},
        "total_matches": 115
    },
    {
        "_id": ObjectId("609c71d828d500ebcf9f526c"),
        "name": "Virdhawal Khade",
        "sport": "swimming",
        "career_stats": {
            "50_free_lcm": {
                "label": "50m Freestyle (LCM)",
                "races": 80,
                "personal_best": {
                    "time": "22.43",
                    "time_ms": 22430,
                    "date": "2018-08-21",
                    "meet_name": "18th Asian Games",
                    "fina_points": 820
                },
                "medals": { "gold": 30, "silver": 15, "bronze": 8 }
            }
        },
        "competitions": ["olympics", "asian_games", "commonwealth_games", "saf_games"],
        "last_updated": datetime.now(timezone.utc),
        "register_info": {"name": "Virdhawal Khade", "unique_name": "Virdhawal Khade"},
        "total_matches": 140
    },
    {
        "_id": ObjectId("609c71d828d500ebcf9f526d"),
        "name": "Maana Patel",
        "sport": "swimming",
        "career_stats": {
            "100_back_lcm": {
                "label": "100m Backstroke (LCM)",
                "races": 40,
                "personal_best": {
                    "time": "1:03.48",
                    "time_ms": 63480,
                    "date": "2023-07-02",
                    "meet_name": "Indian National Championships",
                    "fina_points": 790
                },
                "medals": { "gold": 18, "silver": 8, "bronze": 4 }
            }
        },
        "competitions": ["olympics", "saf_games", "nat_games"],
        "last_updated": datetime.now(timezone.utc),
        "register_info": {"name": "Maana Patel", "unique_name": "Maana Patel"},
        "total_matches": 75
    },
    {
        "_id": ObjectId("609c71d828d500ebcf9f526e"),
        "name": "Kushagra Rawat",
        "sport": "swimming",
        "career_stats": {
            "400_free_lcm": {
                "label": "400m Freestyle (LCM)",
                "races": 35,
                "personal_best": {
                    "time": "3:49.04",
                    "time_ms": 229040,
                    "date": "2021-12-16",
                    "meet_name": "FINA World Championships",
                    "fina_points": 845
                },
                "medals": { "gold": 12, "silver": 7, "bronze": 5 }
            }
        },
        "competitions": ["wa_champs", "asian_games", "nat_games"],
        "last_updated": datetime.now(timezone.utc),
        "register_info": {"name": "Kushagra Rawat", "unique_name": "Kushagra Rawat"},
        "total_matches": 60
    }
]

# Helper to generate standard stat blocks
def create_match(_id, p_id, m_id, date, p_name, c_id, comp, c_label, m_type, event, venue, time, time_ms, rank, splits, rt=0.65, points=800):
    return {
        "_id": ObjectId(_id),
        "player_id": ObjectId(p_id),
        "match_id": m_id,
        "date": date,
        "ingested_at": datetime.now(timezone.utc),
        "stats": {
            "player_name": p_name,
            "competition": comp,
            "competition_label": c_label,
            "match_type": m_type,
            "event": event,
            "venue": venue,
            "performance": {
                "status": "OK",
                "time": time,
                "time_ms": time_ms,
                "reaction_time": rt,
                "rank": rank,
                "fina_points": points,
                "splits": splits
            }
        }
    }

# 3. Prepare Player Matches Data (5 per player)
matches_data = [
    # ---- Srihari Nataraj (100m/50m Back) ----
    create_match("699c7db728d500ebcf9f527a", "609c71d828d500ebcf9f526a", "m_sn_01", "2021-06-27", "Srihari Nataraj", "sn100back", "sette_colli", "Sette Colli Trophy", "Final", "Men's 100m Backstroke", "Stadio del Nuoto, Rome", "53.77", 53770, 1, [{"distance": 50, "cumulative_time": "26.00", "split_time": "26.00"}, {"distance": 100, "cumulative_time": "53.77", "split_time": "27.77"}], 0.58, 880),
    create_match("699c7db728d500ebcf9f527b", "609c71d828d500ebcf9f526a", "m_sn_02", "2021-07-25", "Srihari Nataraj", "sn100back", "olympics", "Tokyo 2020 Olympic Games", "Heats", "Men's 100m Backstroke", "Tokyo Aquatics Centre", "54.31", 54310, 27, [{"distance": 50, "cumulative_time": "26.25", "split_time": "26.25"}, {"distance": 100, "cumulative_time": "54.31", "split_time": "28.06"}], 0.59, 855),
    create_match("699c7db728d500ebcf9f527c", "609c71d828d500ebcf9f526a", "m_sn_03", "2022-08-01", "Srihari Nataraj", "sn100back", "cwg", "Birmingham 2022 Commonwealth Games", "Final", "Men's 50m Backstroke", "Sandwell Aquatics Centre", "25.23", 25230, 5, [{"distance": 50, "cumulative_time": "25.23", "split_time": "25.23"}], 0.57, 840),
    create_match("699c7db728d500ebcf9f527d", "609c71d828d500ebcf9f526a", "m_sn_04", "2023-09-24", "Srihari Nataraj", "sn100back", "asian_games", "19th Asian Games Hangzhou", "Final", "Men's 100m Backstroke", "Hangzhou Olympic Sports Centre", "54.48", 54480, 6, [{"distance": 50, "cumulative_time": "26.30", "split_time": "26.30"}, {"distance": 100, "cumulative_time": "54.48", "split_time": "28.18"}], 0.60, 845),
    create_match("699c7db728d500ebcf9f527e", "609c71d828d500ebcf9f526a", "m_sn_05", "2022-10-02", "Srihari Nataraj", "sn100back", "nat_games", "36th National Games Gujarat", "Final", "Men's 100m Backstroke", "Sardar Patel Aquatics Complex", "55.80", 55800, 1, [{"distance": 50, "cumulative_time": "26.95", "split_time": "26.95"}, {"distance": 100, "cumulative_time": "55.80", "split_time": "28.85"}], 0.61, 800),

    # ---- Sajan Prakash (200m/100m Fly) ----
    create_match("699c7db728d500ebcf9f527f", "609c71d828d500ebcf9f526b", "m_sp_01", "2021-06-26", "Sajan Prakash", "sp200fly", "sette_colli", "Sette Colli Trophy", "Final", "Men's 200m Butterfly", "Stadio del Nuoto, Rome", "1:56.38", 116380, 1, [{"distance": 100, "cumulative_time": "55.10", "split_time": "55.10"}, {"distance": 200, "cumulative_time": "1:56.38", "split_time": "1:01.28"}], 0.65, 864),
    create_match("699c7db728d500ebcf9f5280", "609c71d828d500ebcf9f526b", "m_sp_02", "2021-07-26", "Sajan Prakash", "sp200fly", "olympics", "Tokyo 2020 Olympic Games", "Heats", "Men's 200m Butterfly", "Tokyo Aquatics Centre", "1:57.22", 117220, 24, [{"distance": 100, "cumulative_time": "55.85", "split_time": "55.85"}, {"distance": 200, "cumulative_time": "1:57.22", "split_time": "1:01.37"}], 0.68, 845),
    create_match("699c7db728d500ebcf9f5281", "609c71d828d500ebcf9f526b", "m_sp_03", "2018-08-19", "Sajan Prakash", "sp200fly", "asian_games", "18th Asian Games Jakarta", "Final", "Men's 200m Butterfly", "GBK Aquatic Center", "1:57.75", 117750, 5, [{"distance": 100, "cumulative_time": "56.10", "split_time": "56.10"}, {"distance": 200, "cumulative_time": "1:57.75", "split_time": "1:01.65"}], 0.66, 835),
    create_match("699c7db728d500ebcf9f5282", "609c71d828d500ebcf9f526b", "m_sp_04", "2022-07-31", "Sajan Prakash", "sp200fly", "cwg", "Birmingham 2022 Commonwealth Games", "Heats", "Men's 200m Butterfly", "Sandwell Aquatics Centre", "1:58.99", 118990, 9, [{"distance": 100, "cumulative_time": "56.80", "split_time": "56.80"}, {"distance": 200, "cumulative_time": "1:58.99", "split_time": "1:02.19"}], 0.64, 810),
    create_match("699c7db728d500ebcf9f5283", "609c71d828d500ebcf9f526b", "m_sp_05", "2022-10-04", "Sajan Prakash", "sp200fly", "nat_games", "36th National Games Gujarat", "Final", "Men's 100m Butterfly", "Sardar Patel Aquatics Complex", "53.81", 53810, 1, [{"distance": 50, "cumulative_time": "25.20", "split_time": "25.20"}, {"distance": 100, "cumulative_time": "53.81", "split_time": "28.61"}], 0.65, 805),

    # ---- Virdhawal Khade (50m Free/Fly) ----
    create_match("699c7db728d500ebcf9f5284", "609c71d828d500ebcf9f526c", "m_vk_01", "2018-08-21", "Virdhawal Khade", "vk50free", "asian_games", "18th Asian Games Jakarta", "Final", "Men's 50m Freestyle", "GBK Aquatic Center", "22.43", 22430, 4, [{"distance": 50, "cumulative_time": "22.43", "split_time": "22.43"}], 0.62, 820),
    create_match("699c7db728d500ebcf9f5285", "609c71d828d500ebcf9f526c", "m_vk_02", "2010-11-16", "Virdhawal Khade", "vk50free", "asian_games", "16th Asian Games Guangzhou", "Final", "Men's 50m Butterfly", "Aoti Aquatic Centre", "24.31", 24310, 3, [{"distance": 50, "cumulative_time": "24.31", "split_time": "24.31"}], 0.68, 835),
    create_match("699c7db728d500ebcf9f5286", "609c71d828d500ebcf9f526c", "m_vk_03", "2008-08-14", "Virdhawal Khade", "vk50free", "olympics", "Beijing 2008 Olympic Games", "Heats", "Men's 50m Freestyle", "National Aquatics Center", "22.73", 22730, 40, [{"distance": 50, "cumulative_time": "22.73", "split_time": "22.73"}], 0.65, 790),
    create_match("699c7db728d500ebcf9f5287", "609c71d828d500ebcf9f526c", "m_vk_04", "2019-09-26", "Virdhawal Khade", "vk50free", "asian_age_group", "10th Asian Age Group Championships", "Final", "Men's 50m Freestyle", "Padukone-Dravid Centre", "22.59", 22590, 1, [{"distance": 50, "cumulative_time": "22.59", "split_time": "22.59"}], 0.64, 805),
    create_match("699c7db728d500ebcf9f5288", "609c71d828d500ebcf9f526c", "m_vk_05", "2022-10-06", "Virdhawal Khade", "vk50free", "nat_games", "36th National Games Gujarat", "Final", "Men's 50m Freestyle", "Sardar Patel Aquatics Complex", "22.82", 22820, 2, [{"distance": 50, "cumulative_time": "22.82", "split_time": "22.82"}], 0.63, 780),

    # ---- Maana Patel (100m/50m Back) ----
    create_match("699c7db728d500ebcf9f5289", "609c71d828d500ebcf9f526d", "m_mp_01", "2023-07-02", "Maana Patel", "mp100back", "nat_champs", "Indian National Championships", "Final", "Women's 100m Backstroke", "GMC Balayogi Aquatic Centre", "1:03.48", 63480, 1, [{"distance": 50, "cumulative_time": "30.50", "split_time": "30.50"}, {"distance": 100, "cumulative_time": "1:03.48", "split_time": "32.98"}], 0.59, 790),
    create_match("699c7db728d500ebcf9f528a", "609c71d828d500ebcf9f526d", "m_mp_02", "2021-07-25", "Maana Patel", "mp100back", "olympics", "Tokyo 2020 Olympic Games", "Heats", "Women's 100m Backstroke", "Tokyo Aquatics Centre", "1:05.20", 65200, 39, [{"distance": 50, "cumulative_time": "31.46", "split_time": "31.46"}, {"distance": 100, "cumulative_time": "1:05.20", "split_time": "33.74"}], 0.62, 730),
    create_match("699c7db728d500ebcf9f528b", "609c71d828d500ebcf9f526d", "m_mp_03", "2023-09-25", "Maana Patel", "mp100back", "asian_games", "19th Asian Games Hangzhou", "Heats", "Women's 50m Backstroke", "Hangzhou Olympic Sports Centre", "30.06", 30060, 13, [{"distance": 50, "cumulative_time": "30.06", "split_time": "30.06"}], 0.60, 755),
    create_match("699c7db728d500ebcf9f528c", "609c71d828d500ebcf9f526d", "m_mp_04", "2022-10-03", "Maana Patel", "mp100back", "nat_games", "36th National Games Gujarat", "Final", "Women's 100m Backstroke", "Sardar Patel Aquatics Complex", "1:04.35", 64350, 1, [{"distance": 50, "cumulative_time": "31.10", "split_time": "31.10"}, {"distance": 100, "cumulative_time": "1:04.35", "split_time": "33.25"}], 0.61, 760),
    create_match("699c7db728d500ebcf9f528d", "609c71d828d500ebcf9f526d", "m_mp_05", "2021-06-25", "Maana Patel", "mp100back", "sette_colli", "Sette Colli Trophy", "Heats", "Women's 100m Backstroke", "Stadio del Nuoto, Rome", "1:03.77", 63770, 15, [{"distance": 50, "cumulative_time": "30.80", "split_time": "30.80"}, {"distance": 100, "cumulative_time": "1:03.77", "split_time": "32.97"}], 0.60, 780),

    # ---- Kushagra Rawat (400m Free) ----
    create_match("699c7db728d500ebcf9f528e", "609c71d828d500ebcf9f526e", "m_kr_01", "2021-12-16", "Kushagra Rawat", "kr400free", "wa_champs", "FINA World Championships", "Heats", "Men's 400m Freestyle", "Etihad Arena, Abu Dhabi", "3:49.04", 229040, 15, [{"distance": 100, "cumulative_time": "55.50", "split_time": "55.50"}, {"distance": 200, "cumulative_time": "1:53.20", "split_time": "57.70"}, {"distance": 400, "cumulative_time": "3:49.04", "split_time": "1:55.84"}], 0.70, 845),
    create_match("699c7db728d500ebcf9f528f", "609c71d828d500ebcf9f526e", "m_kr_02", "2022-07-29", "Kushagra Rawat", "kr400free", "cwg", "Birmingham 2022 Commonwealth Games", "Heats", "Men's 400m Freestyle", "Sandwell Aquatics Centre", "3:57.45", 237450, 14, [{"distance": 100, "cumulative_time": "56.80", "split_time": "56.80"}, {"distance": 200, "cumulative_time": "1:56.50", "split_time": "59.70"}, {"distance": 400, "cumulative_time": "3:57.45", "split_time": "2:00.95"}], 0.73, 760),
    create_match("699c7db728d500ebcf9f5290", "609c71d828d500ebcf9f526e", "m_kr_03", "2023-09-26", "Kushagra Rawat", "kr400free", "asian_games", "19th Asian Games Hangzhou", "Heats", "Men's 400m Freestyle", "Hangzhou Olympic Sports Centre", "3:55.45", 235450, 11, [{"distance": 100, "cumulative_time": "56.50", "split_time": "56.50"}, {"distance": 200, "cumulative_time": "1:55.80", "split_time": "59.30"}, {"distance": 400, "cumulative_time": "3:55.45", "split_time": "1:59.65"}], 0.72, 780),
    create_match("699c7db728d500ebcf9f5291", "609c71d828d500ebcf9f526e", "m_kr_04", "2022-10-05", "Kushagra Rawat", "kr400free", "nat_games", "36th National Games Gujarat", "Final", "Men's 400m Freestyle", "Sardar Patel Aquatics Complex", "3:53.75", 233750, 1, [{"distance": 100, "cumulative_time": "56.10", "split_time": "56.10"}, {"distance": 200, "cumulative_time": "1:54.90", "split_time": "58.80"}, {"distance": 400, "cumulative_time": "3:53.75", "split_time": "1:58.85"}], 0.69, 795),
    create_match("699c7db728d500ebcf9f5292", "609c71d828d500ebcf9f526e", "m_kr_05", "2022-06-18", "Kushagra Rawat", "kr400free", "wa_champs", "FINA World Championships", "Heats", "Men's 400m Freestyle", "Duna Arena, Budapest", "3:52.39", 232390, 24, [{"distance": 100, "cumulative_time": "55.80", "split_time": "55.80"}, {"distance": 200, "cumulative_time": "1:54.10", "split_time": "58.30"}, {"distance": 400, "cumulative_time": "3:52.39", "split_time": "1:58.29"}], 0.71, 810)
]

# 4. Insert Data
print("Inserting players data...")
db.players.insert_many(players_data)

print("Inserting player_matches data...")
db.player_matches.insert_many(matches_data)

# 5. Create Indexes
# print("Creating indexes for players collection...")
# db.players.create_index([("name", pymongo.ASCENDING)])
# db.players.create_index([("competitions", pymongo.ASCENDING)])
# db.players.create_index([("sport", pymongo.ASCENDING)])

# print("Creating indexes for player_matches collection...")
# db.player_matches.create_index([("player_id", pymongo.ASCENDING), ("date", pymongo.DESCENDING)])
# db.player_matches.create_index([("match_id", pymongo.ASCENDING), ("player_id", pymongo.ASCENDING)], unique=True)
# db.player_matches.create_index([("stats.competition", pymongo.ASCENDING)])
# db.player_matches.create_index([("stats.event", pymongo.ASCENDING)])

print(f"Seed complete! Inserted {len(players_data)} players and {len(matches_data)} match records.")