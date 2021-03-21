import os
from flask import Flask, render_template, request, abort, jsonify
from pathlib import Path
import pandas as pd
import numpy as np
import json

from py.game import games_generator_from_file
from py.trie import make_game_trie, count_trie, filter_trie, get_sub_trie
from py.analysis import get_top_lines

app = Flask(__name__)

app_cache = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analysis')
def detr():
    return render_template('analysis.html')


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(NpEncoder, self).default(obj)

@app.route('/api/analysis', methods=['POST'])
def api_analysis():
    data = request.json

    if 'sessionID' not in data or 'action' not in data:
        error_code = 401
    else:
        error_code = 201
        session_id = data['sessionID']
        action = data['action']

        if session_id not in app_cache:
            app_cache[session_id] = {}

        if action == 'load':
            pgn = app_cache[session_id]['PGN'] = data['PGN']
            pgn_filename = data['uploadedPGNFilename']
            if (pgn_hash := hash(pgn)) != 0:
                if not Path(pgn_filename).exists():
                    with open(pgn_filename, 'w+t') as pgn_file:
                        pgn_file.write(pgn)
                games_gen = games_generator_from_file(pgn_filename)
                games = app_cache[session_id]['games'] = list(games_gen)
                trie = app_cache[session_id]['trie'] = make_game_trie(games)
                ret = {'message': f'{len(games)} games loaded'}
            else:
                ret = {'message': f'Provided PGN empty or invalid'}
                error_code = 201
        
        elif action == 'get-cached-pgn':
            cached_pgn_filename = data['cachedPGNFilename']
            games_gen = games_generator_from_file(cached_pgn_filename)
            games = app_cache[session_id]['games'] = list(games_gen)
            trie = app_cache[session_id]['trie'] = make_game_trie(games)
            ret = {'message': f'{len(games)} games loaded'}
        
        elif action == 'get-moves':
            trie = app_cache[session_id].get('trie', {})
            if not trie:
                games = app_cache[session_id].get('games', [])
                if not games:
                    ret = {'message': 'No PGN loaded'}
                    return ret, error_code
                else:
                    trie = app_cache[session_id]['trie'] = make_game_trie(games)
            moves = data['moves']
            line_trie = get_sub_trie(trie, moves)
            counts = {m: count_trie(line_trie[m]) for m in line_trie}
            next_moves_zipped = sorted(counts.items(), key=lambda x: x[1], reverse=True)
            next_moves, next_move_counts = list(zip(*next_moves_zipped))
            total_count = sum(list(counts.values()))

            ret = {
                'message': f'{len(next_moves)} moves ({next_moves}) from prefix {moves} totaling {total_count} games',
                'nextMoves': next_moves
            }

        elif action == 'top-lines':
            trie = app_cache[session_id].get('trie', {})
            M = 5
            D = 5
            moves = data.get('moves', [])
            line_trie = get_sub_trie(trie, moves)
            top_lines = get_top_lines(line_trie, max_depth=D)[:M]
            top_lines_df = pd.DataFrame(line._asdict() for line in top_lines)
            accum_prob = sum(l.score for l in top_lines)
            data = []
            message = f"{M} lines make up {accum_prob*100:.1f}% of the lines starting from {moves}"
            for line in top_lines:
                data.append([np.round(line.score, 5), list(zip(line.moves, np.round(line.freqs, 3).tolist(), line.counts))])
            ret = {'message': message, 'topLines': data}
            print('data', data)
        
        elif action == 'get-cached-pgn-ids':
            from glob2 import glob
            pgn_filenames = glob('*.pgn')
            message = f"{len(pgn_filenames)} to choose from"
            ret = {'message': message, 'PGNFilenames': pgn_filenames}

        elif action == 'find-tactics':
            ret = {}

        else:
            ret = {}
    return json.dumps(ret, cls=NpEncoder), error_code


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.environ.get('PORT', 3000), debug=True)
