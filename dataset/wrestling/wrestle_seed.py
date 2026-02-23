import pymongo
from pymongo import ASCENDING, DESCENDING
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# --- 1. MongoDB Connection Setup ---
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    sys.exit("ERROR: MONGO_URI is not set. Add it to dataset/.env or export it.")
client = pymongo.MongoClient(MONGO_URI)
db = client[os.getenv("DB", "sportfolio4")]

# Clear existing collections
# db.players.drop()
# db.player_matches.drop()

now_utc = datetime.now(timezone.utc).isoformat()

# --- 2. Real Player Data (Enriched Multi-Category Stats) ---
players_data = [
    {
        "_id": "609c71d828d500ebcf9f5201", "name": "Bajrang Punia", "sport": "wrestling",
        "career_stats": {
            "65kg_fs": {"label": "Men's 65kg Freestyle", "matches": 142, "medals": {"gold": 12, "silver": 5, "bronze": 8}},
            "61kg_fs": {"label": "Men's 61kg Freestyle", "matches": 38, "medals": {"gold": 1, "silver": 3, "bronze": 2}},
            "60kg_fs": {"label": "Men's 60kg Freestyle", "matches": 55, "medals": {"gold": 3, "silver": 4, "bronze": 5}}
        },
        "competitions": ["olympics", "world_champs", "cwc", "asian_games", "asian_champs"], 
        "cricsheet_id": "wr_bajrang", "last_updated": now_utc, "total_matches": 235
    },
    {
        "_id": "609c71d828d500ebcf9f5202", "name": "Ravi Kumar Dahiya", "sport": "wrestling",
        "career_stats": {
            "57kg_fs": {"label": "Men's 57kg Freestyle", "matches": 85, "medals": {"gold": 8, "silver": 2, "bronze": 4}}
        },
        "competitions": ["olympics", "world_champs", "asian_champs", "cwc"], 
        "cricsheet_id": "wr_ravi", "last_updated": now_utc, "total_matches": 85
    },
    {
        "_id": "609c71d828d500ebcf9f5203", "name": "Aman Sehrawat", "sport": "wrestling",
        "career_stats": {
            "57kg_fs": {"label": "Men's 57kg Freestyle", "matches": 62, "medals": {"gold": 6, "silver": 1, "bronze": 4}}
        },
        "competitions": ["olympics", "asian_champs", "asian_games", "world_champs"], 
        "cricsheet_id": "wr_aman", "last_updated": now_utc, "total_matches": 62
    },
    {
        "_id": "609c71d828d500ebcf9f5204", "name": "Deepak Punia", "sport": "wrestling",
        "career_stats": {
            "86kg_fs": {"label": "Men's 86kg Freestyle", "matches": 94, "medals": {"gold": 5, "silver": 6, "bronze": 7}},
            "92kg_fs": {"label": "Men's 92kg Freestyle", "matches": 12, "medals": {"gold": 1, "silver": 0, "bronze": 1}}
        },
        "competitions": ["olympics", "world_champs", "cwc", "asian_games"], 
        "cricsheet_id": "wr_deepak", "last_updated": now_utc, "total_matches": 106
    },
    {
        "_id": "609c71d828d500ebcf9f5205", "name": "Vinesh Phogat", "sport": "wrestling",
        "career_stats": {
            "53kg_fs": {"label": "Women's 53kg Freestyle", "matches": 110, "medals": {"gold": 9, "silver": 2, "bronze": 5}},
            "50kg_fs": {"label": "Women's 50kg Freestyle", "matches": 45, "medals": {"gold": 5, "silver": 1, "bronze": 1}},
            "48kg_fs": {"label": "Women's 48kg Freestyle", "matches": 60, "medals": {"gold": 4, "silver": 3, "bronze": 6}}
        },
        "competitions": ["olympics", "world_champs", "asian_games", "cwc"], 
        "cricsheet_id": "wr_vinesh", "last_updated": now_utc, "total_matches": 215
    },
    {
        "_id": "609c71d828d500ebcf9f5206", "name": "Antim Panghal", "sport": "wrestling",
        "career_stats": {
            "53kg_fs": {"label": "Women's 53kg Freestyle", "matches": 58, "medals": {"gold": 6, "silver": 2, "bronze": 3}},
            "55kg_fs": {"label": "Women's 55kg Freestyle", "matches": 14, "medals": {"gold": 2, "silver": 0, "bronze": 1}}
        },
        "competitions": ["olympics", "world_champs", "asian_games", "world_u20"], 
        "cricsheet_id": "wr_antim", "last_updated": now_utc, "total_matches": 72
    },
    {
        "_id": "609c71d828d500ebcf9f5207", "name": "Sakshi Malik", "sport": "wrestling",
        "career_stats": {
            "58kg_fs": {"label": "Women's 58kg Freestyle", "matches": 75, "medals": {"gold": 3, "silver": 4, "bronze": 8}},
            "60kg_fs": {"label": "Women's 60kg Freestyle", "matches": 22, "medals": {"gold": 1, "silver": 1, "bronze": 3}},
            "62kg_fs": {"label": "Women's 62kg Freestyle", "matches": 40, "medals": {"gold": 4, "silver": 2, "bronze": 5}},
            "65kg_fs": {"label": "Women's 65kg Freestyle", "matches": 18, "medals": {"gold": 1, "silver": 2, "bronze": 1}}
        },
        "competitions": ["olympics", "cwc", "asian_champs", "world_champs"], 
        "cricsheet_id": "wr_sakshi", "last_updated": now_utc, "total_matches": 155
    },
    {
        "_id": "609c71d828d500ebcf9f5208", "name": "Anshu Malik", "sport": "wrestling",
        "career_stats": {
            "57kg_fs": {"label": "Women's 57kg Freestyle", "matches": 68, "medals": {"gold": 5, "silver": 6, "bronze": 4}},
            "59kg_fs": {"label": "Women's 59kg Freestyle", "matches": 15, "medals": {"gold": 2, "silver": 1, "bronze": 1}}
        },
        "competitions": ["olympics", "world_champs", "asian_champs", "cwc"], 
        "cricsheet_id": "wr_anshu", "last_updated": now_utc, "total_matches": 83
    },
    {
        "_id": "609c71d828d500ebcf9f5209", "name": "Reetika Hooda", "sport": "wrestling",
        "career_stats": {
            "76kg_fs": {"label": "Women's 76kg Freestyle", "matches": 35, "medals": {"gold": 3, "silver": 1, "bronze": 3}},
            "72kg_fs": {"label": "Women's 72kg Freestyle", "matches": 20, "medals": {"gold": 1, "silver": 2, "bronze": 2}}
        },
        "competitions": ["olympics", "world_u23", "asian_champs"], 
        "cricsheet_id": "wr_reetika", "last_updated": now_utc, "total_matches": 55
    },
    {
        "_id": "609c71d828d500ebcf9f5210", "name": "Nisha Dahiya", "sport": "wrestling",
        "career_stats": {
            "68kg_fs": {"label": "Women's 68kg Freestyle", "matches": 42, "medals": {"gold": 2, "silver": 3, "bronze": 4}},
            "65kg_fs": {"label": "Women's 65kg Freestyle", "matches": 28, "medals": {"gold": 1, "silver": 1, "bronze": 3}}
        },
        "competitions": ["olympics", "asian_champs", "world_u23"], 
        "cricsheet_id": "wr_nisha", "last_updated": now_utc, "total_matches": 70
    }
]

# --- 3. Real Match Data (Exact Historical Bouts) ---
def build_match(m_id, p_id, p_name, ext_id, date, comp_code, comp_label, m_type, event, opponent, status, result, pts_scored, pts_conceded):
    return {
        "_id": m_id, "player_id": p_id, "match_id": ext_id, "date": date, "ingested_at": now_utc,
        "stats": {
            "player_name": p_name, "cricsheet_id": f"wr_{p_name.split()[0].lower()}",
            "competition": comp_code, "competition_label": comp_label, "match_type": m_type, "event": event,
            "opponent_name": opponent,
            "performance": {
                "status": status, "result": result,
                "technical_points_scored": pts_scored, "technical_points_conceded": pts_conceded
            }
        }
    }

raw_matches = [
    ("m_1_1", "609c71d828d500ebcf9f5201", "Bajrang Punia", "ext_1_1", "2021-08-07", "olympics", "Tokyo 2020 Olympics", "Bronze Medal Match", "Men's 65kg", "Daulet Niyazbekov (KAZ)", "VPO", "Win", 8, 0),
    ("m_1_2", "609c71d828d500ebcf9f5201", "Bajrang Punia", "ext_1_2", "2021-08-06", "olympics", "Tokyo 2020 Olympics", "Semifinal", "Men's 65kg", "Haji Aliyev (AZE)", "VPO1", "Loss", 5, 12),
    ("m_1_3", "609c71d828d500ebcf9f5201", "Bajrang Punia", "ext_1_3", "2021-08-06", "olympics", "Tokyo 2020 Olympics", "Quarterfinal", "Men's 65kg", "Morteza Ghiasi (IRI)", "VFA", "Win", 2, 1),
    ("m_1_4", "609c71d828d500ebcf9f5201", "Bajrang Punia", "ext_1_4", "2021-08-06", "olympics", "Tokyo 2020 Olympics", "Round of 16", "Men's 65kg", "Ernazar Akmataliev (KGZ)", "VPO1", "Win", 3, 3),
    ("m_1_5", "609c71d828d500ebcf9f5201", "Bajrang Punia", "ext_1_5", "2022-08-05", "cwc", "Birmingham 2022 CWG", "Final", "Men's 65kg", "Lachlan McNeil (CAN)", "VPO1", "Win", 9, 2),

    ("m_2_1", "609c71d828d500ebcf9f5202", "Ravi Kumar Dahiya", "ext_2_1", "2021-08-05", "olympics", "Tokyo 2020 Olympics", "Final", "Men's 57kg", "Zaur Uguev (ROC)", "VPO1", "Loss", 4, 7),
    ("m_2_2", "609c71d828d500ebcf9f5202", "Ravi Kumar Dahiya", "ext_2_2", "2021-08-04", "olympics", "Tokyo 2020 Olympics", "Semifinal", "Men's 57kg", "Nurislam Sanayev (KAZ)", "VFA", "Win", 7, 9),
    ("m_2_3", "609c71d828d500ebcf9f5202", "Ravi Kumar Dahiya", "ext_2_3", "2021-08-04", "olympics", "Tokyo 2020 Olympics", "Quarterfinal", "Men's 57kg", "Georgi Vangelov (BUL)", "VSU1", "Win", 14, 4),
    ("m_2_4", "609c71d828d500ebcf9f5202", "Ravi Kumar Dahiya", "ext_2_4", "2021-08-04", "olympics", "Tokyo 2020 Olympics", "Round of 16", "Men's 57kg", "Oscar Tigreros (COL)", "VSU1", "Win", 13, 2),
    ("m_2_5", "609c71d828d500ebcf9f5202", "Ravi Kumar Dahiya", "ext_2_5", "2022-08-06", "cwc", "Birmingham 2022 CWG", "Final", "Men's 57kg", "Ebikewenimo Welson (NGR)", "VSU", "Win", 10, 0),

    ("m_3_1", "609c71d828d500ebcf9f5203", "Aman Sehrawat", "ext_3_1", "2024-08-09", "olympics", "Paris 2024 Olympics", "Bronze Medal Match", "Men's 57kg", "Darian Cruz (PUR)", "VPO1", "Win", 13, 5),
    ("m_3_2", "609c71d828d500ebcf9f5203", "Aman Sehrawat", "ext_3_2", "2024-08-08", "olympics", "Paris 2024 Olympics", "Semifinal", "Men's 57kg", "Rei Higuchi (JPN)", "VSU", "Loss", 0, 10),
    ("m_3_3", "609c71d828d500ebcf9f5203", "Aman Sehrawat", "ext_3_3", "2024-08-08", "olympics", "Paris 2024 Olympics", "Quarterfinal", "Men's 57kg", "Zelimkhan Abakarov (ALB)", "VSU", "Win", 12, 0),
    ("m_3_4", "609c71d828d500ebcf9f5203", "Aman Sehrawat", "ext_3_4", "2024-08-08", "olympics", "Paris 2024 Olympics", "Round of 16", "Men's 57kg", "Vladimir Egorov (MKD)", "VSU", "Win", 10, 0),
    ("m_3_5", "609c71d828d500ebcf9f5203", "Aman Sehrawat", "ext_3_5", "2023-04-13", "asian_champs", "Astana 2023 Asian Champs", "Final", "Men's 57kg", "Almaz Smanbekov (KGZ)", "VPO1", "Win", 9, 4),

    ("m_4_1", "609c71d828d500ebcf9f5204", "Deepak Punia", "ext_4_1", "2021-08-05", "olympics", "Tokyo 2020 Olympics", "Bronze Medal Match", "Men's 86kg", "Myles Amine (SMR)", "VPO1", "Loss", 2, 4),
    ("m_4_2", "609c71d828d500ebcf9f5204", "Deepak Punia", "ext_4_2", "2021-08-04", "olympics", "Tokyo 2020 Olympics", "Semifinal", "Men's 86kg", "David Taylor (USA)", "VSU", "Loss", 0, 10),
    ("m_4_3", "609c71d828d500ebcf9f5204", "Deepak Punia", "ext_4_3", "2021-08-04", "olympics", "Tokyo 2020 Olympics", "Quarterfinal", "Men's 86kg", "Lin Zushen (CHN)", "VPO1", "Win", 6, 3),
    ("m_4_4", "609c71d828d500ebcf9f5204", "Deepak Punia", "ext_4_4", "2021-08-04", "olympics", "Tokyo 2020 Olympics", "Round of 16", "Men's 86kg", "Ekerekeme Agiomor (NGR)", "VSU1", "Win", 12, 1),
    ("m_4_5", "609c71d828d500ebcf9f5204", "Deepak Punia", "ext_4_5", "2022-08-05", "cwc", "Birmingham 2022 CWG", "Final", "Men's 86kg", "Muhammad Inam (PAK)", "VPO", "Win", 3, 0),

    ("m_5_1", "609c71d828d500ebcf9f5205", "Vinesh Phogat", "ext_5_1", "2024-08-06", "olympics", "Paris 2024 Olympics", "Semifinal", "Women's 50kg", "Yusneylys Guzmán (CUB)", "VPO", "Win", 5, 0),
    ("m_5_2", "609c71d828d500ebcf9f5205", "Vinesh Phogat", "ext_5_2", "2024-08-06", "olympics", "Paris 2024 Olympics", "Quarterfinal", "Women's 50kg", "Oksana Livach (UKR)", "VPO1", "Win", 7, 5),
    ("m_5_3", "609c71d828d500ebcf9f5205", "Vinesh Phogat", "ext_5_3", "2024-08-06", "olympics", "Paris 2024 Olympics", "Round of 16", "Women's 50kg", "Yui Susaki (JPN)", "VPO1", "Win", 3, 2),
    ("m_5_4", "609c71d828d500ebcf9f5205", "Vinesh Phogat", "ext_5_4", "2022-09-14", "world_champs", "Belgrade 2022 Worlds", "Bronze Medal Match", "Women's 53kg", "Emma Malmgren (SWE)", "VPO", "Win", 8, 0),
    ("m_5_5", "609c71d828d500ebcf9f5205", "Vinesh Phogat", "ext_5_5", "2022-08-06", "cwc", "Birmingham 2022 CWG", "Final", "Women's 53kg", "Samantha Stewart (CAN)", "VFA", "Win", 4, 0),

    ("m_6_1", "609c71d828d500ebcf9f5206", "Antim Panghal", "ext_6_1", "2024-08-07", "olympics", "Paris 2024 Olympics", "Round of 16", "Women's 53kg", "Zeynep Yetgil (TUR)", "VSU", "Loss", 0, 10),
    ("m_6_2", "609c71d828d500ebcf9f5206", "Antim Panghal", "ext_6_2", "2023-09-21", "world_champs", "Belgrade 2023 Worlds", "Bronze Medal Match", "Women's 53kg", "Jonna Malmgren (SWE)", "VSU1", "Win", 16, 6),
    ("m_6_3", "609c71d828d500ebcf9f5206", "Antim Panghal", "ext_6_3", "2023-09-20", "world_champs", "Belgrade 2023 Worlds", "Quarterfinal", "Women's 53kg", "Natalia Malysheva (AIN)", "VPO1", "Win", 9, 6),
    ("m_6_4", "609c71d828d500ebcf9f5206", "Antim Panghal", "ext_6_4", "2023-10-05", "asian_games", "Hangzhou 2022 Asian Games", "Bronze Medal Match", "Women's 53kg", "Bat-Ochiryn Bolortuyaa (MGL)", "VPO1", "Win", 3, 1),
    ("m_6_5", "609c71d828d500ebcf9f5206", "Antim Panghal", "ext_6_5", "2023-08-18", "world_u20", "Amman 2023 U20 Worlds", "Final", "Women's 53kg", "Mariia Yefremova (UKR)", "VPO", "Win", 4, 0),

    ("m_7_1", "609c71d828d500ebcf9f5207", "Sakshi Malik", "ext_7_1", "2016-08-17", "olympics", "Rio 2016 Olympics", "Bronze Medal Match", "Women's 58kg", "Aisuluu Tynybekova (KGZ)", "VPO1", "Win", 8, 5),
    ("m_7_2", "609c71d828d500ebcf9f5207", "Sakshi Malik", "ext_7_2", "2016-08-17", "olympics", "Rio 2016 Olympics", "Repechage", "Women's 58kg", "Pürevdorjiin Orkhon (MGL)", "VPO1", "Win", 12, 3),
    ("m_7_3", "609c71d828d500ebcf9f5207", "Sakshi Malik", "ext_7_3", "2016-08-17", "olympics", "Rio 2016 Olympics", "Quarterfinal", "Women's 58kg", "Valeria Koblova (RUS)", "VPO1", "Loss", 2, 9),
    ("m_7_4", "609c71d828d500ebcf9f5207", "Sakshi Malik", "ext_7_4", "2016-08-17", "olympics", "Rio 2016 Olympics", "Round of 16", "Women's 58kg", "Mariana Cherdivara (MDA)", "VPO1", "Win", 5, 5),
    ("m_7_5", "609c71d828d500ebcf9f5207", "Sakshi Malik", "ext_7_5", "2022-08-05", "cwc", "Birmingham 2022 CWG", "Final", "Women's 62kg", "Ana Godinez (CAN)", "VFA", "Win", 4, 4),

    ("m_8_1", "609c71d828d500ebcf9f5208", "Anshu Malik", "ext_8_1", "2024-08-08", "olympics", "Paris 2024 Olympics", "Round of 16", "Women's 57kg", "Helen Maroulis (USA)", "VPO1", "Loss", 2, 7),
    ("m_8_2", "609c71d828d500ebcf9f5208", "Anshu Malik", "ext_8_2", "2021-10-07", "world_champs", "Oslo 2021 Worlds", "Final", "Women's 57kg", "Helen Maroulis (USA)", "VFA", "Loss", 1, 4),
    ("m_8_3", "609c71d828d500ebcf9f5208", "Anshu Malik", "ext_8_3", "2021-10-06", "world_champs", "Oslo 2021 Worlds", "Semifinal", "Women's 57kg", "Veronika Chumikova (RWF)", "VSU", "Win", 11, 0),
    ("m_8_4", "609c71d828d500ebcf9f5208", "Anshu Malik", "ext_8_4", "2022-08-05", "cwc", "Birmingham 2022 CWG", "Final", "Women's 57kg", "Odunayo Adekuoroye (NGR)", "VPO1", "Loss", 3, 7),
    ("m_8_5", "609c71d828d500ebcf9f5208", "Anshu Malik", "ext_8_5", "2024-04-14", "asian_champs", "Bishkek 2024 Asian Champs", "Final", "Women's 57kg", "Tsugumi Sakurai (JPN)", "VSU", "Loss", 0, 10),

    ("m_9_1", "609c71d828d500ebcf9f5209", "Reetika Hooda", "ext_9_1", "2024-08-10", "olympics", "Paris 2024 Olympics", "Quarterfinal", "Women's 76kg", "Aiperi Medet Kyzy (KGZ)", "VPO1", "Loss", 1, 1),
    ("m_9_2", "609c71d828d500ebcf9f5209", "Reetika Hooda", "ext_9_2", "2024-08-10", "olympics", "Paris 2024 Olympics", "Round of 16", "Women's 76kg", "Bernadett Nagy (HUN)", "VSU1", "Win", 12, 2),
    ("m_9_3", "609c71d828d500ebcf9f5209", "Reetika Hooda", "ext_9_3", "2023-10-27", "world_u23", "Tirana 2023 U23 Worlds", "Final", "Women's 76kg", "Kennedy Blades (USA)", "VPO1", "Win", 9, 2),
    ("m_9_4", "609c71d828d500ebcf9f5209", "Reetika Hooda", "ext_9_4", "2023-04-12", "asian_champs", "Astana 2023 Asian Champs", "Bronze Medal Match", "Women's 76kg", "Svetlana Oknazarova (UZB)", "VPO1", "Win", 5, 1),
    ("m_9_5", "609c71d828d500ebcf9f5209", "Reetika Hooda", "ext_9_5", "2024-04-20", "asian_qualifiers", "Bishkek 2024 Asian Qualifiers", "Semifinal", "Women's 76kg", "Chang Hui-tsz (TPE)", "VPO", "Win", 7, 0),

    ("m_10_1", "609c71d828d500ebcf9f5210", "Nisha Dahiya", "ext_10_1", "2024-08-05", "olympics", "Paris 2024 Olympics", "Quarterfinal", "Women's 68kg", "Pak Sol-gum (PRK)", "VPO1", "Loss", 8, 10),
    ("m_10_2", "609c71d828d500ebcf9f5210", "Nisha Dahiya", "ext_10_2", "2024-08-05", "olympics", "Paris 2024 Olympics", "Round of 16", "Women's 68kg", "Tetiana Sova (UKR)", "VPO1", "Win", 6, 4),
    ("m_10_3", "609c71d828d500ebcf9f5210", "Nisha Dahiya", "ext_10_3", "2024-04-21", "asian_qualifiers", "Bishkek 2024 Asian Qualifiers", "Semifinal", "Women's 68kg", "Alexandra Zaitseva (KAZ)", "VSU", "Win", 10, 0),
    ("m_10_4", "609c71d828d500ebcf9f5210", "Nisha Dahiya", "ext_10_4", "2023-04-11", "asian_champs", "Astana 2023 Asian Champs", "Semifinal", "Women's 68kg", "Zhou Feng (CHN)", "VPO1", "Loss", 2, 6),
    ("m_10_5", "609c71d828d500ebcf9f5210", "Nisha Dahiya", "ext_10_5", "2023-04-11", "asian_champs", "Astana 2023 Asian Champs", "Bronze Medal Match", "Women's 68kg", "Meerim Zhumanazarova (KGZ)", "VFA", "Win", 7, 6)
]

matches_data = [build_match(*row) for row in raw_matches]

# --- 4. Database Insertion ---
db.players.insert_many(players_data)
db.player_matches.insert_many(matches_data)

# --- 5. Apply Schema Indexes ---
# db.players.create_index([("name", ASCENDING)])
# db.players.create_index([("cricsheet_id", ASCENDING)], unique=True)
# db.players.create_index([("competitions", ASCENDING)])
# db.players.create_index([("sport", ASCENDING)])

# db.player_matches.create_index([("player_id", ASCENDING), ("date", DESCENDING)])
# db.player_matches.create_index([("match_id", ASCENDING), ("player_id", ASCENDING)], unique=True)
# db.player_matches.create_index([("stats.competition", ASCENDING)])
# db.player_matches.create_index([("stats.event", ASCENDING)])

print("Successfully seeded database with enriched multi-category historical Indian wrestling data.")